import { app as electronApp, BrowserWindow, ipcMain, Notification } from "electron";
import path from "node:path";
import { addUser, existsUser, user } from "lib/database";
import { MailDTO, StreamDTO, UserDTO } from "lib/database/dto";
import { UserService } from "lib/database/service";
import { Handler, MailNetwork, SocketStatus, StreamManager } from "lib/stream/network";
import { ImapCommandMap, Pop3CommandMap } from "lib/command";
import { ImapTransform, Pop3Transform } from "lib/stream/transform";
import { ImapParser, Pop3Parser } from "lib/parser";
import { timeout } from "./utils/timeout";
import { createQuery, Flag, FlagOperation } from "lib/command/imap";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { decodeMime, decodeWords } from "./utils/decodeMime";
import { safeResult, safeUIDFetchResult, safeUIDSearchResult } from "./utils/safeResult";
import { findImapMailbox } from "./utils/findImapMailbox";
import { MailFilter } from "./type";
import { ContentSchemaType } from "lib/schema/common";

type LoginStatus = "LOGIN" | "LOGIN_FAIL" | "LOGIN_SUCCESS";

const browserPath = electronApp.isPackaged ? path.join(__dirname, "./renderer") : "http://localhost:5173";
const UPDATE_INTERVAL = 2000;
const MAIL_LOGIN_TIMEOUT = 5000;

type UpdateType = "UPDATED" | "PROCESSING";
type Update = {
    type: UpdateType;
    doneTime: number;
};

export class App {

    private entryWindow: BrowserWindow | undefined;
    private mainWindow: BrowserWindow | undefined;
    private infoWindow: BrowserWindow | undefined;
    private mailViewWindow: BrowserWindow | undefined;

    private userService: UserService | undefined;
    private streamManager = new StreamManager();
    private streamLoginMap: Map<string, LoginStatus> = new Map();

    private updateTimer: NodeJS.Timeout | undefined;
    private updateQueue: Promise<void> = Promise.resolve();
    private updateMap: Map<string, Update> = new Map();

    private selectedStreamId: string = "";

    initEntryWindow() {
        this.entryWindow = new BrowserWindow({
            width: 600,
            height: 800,
            focusable: true,
            resizable: false,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload/preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.entryWindow.loadURL(`${browserPath}/entry.html`);
            this.entryWindow.webContents.openDevTools({ mode: "detach" });
        } else {
            this.entryWindow.loadFile(`${browserPath}/entry.html`);
        }

        this.ipcRendererRequest(this.entryWindow);
    }

    initMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1080,
            height: 800,
            focusable: true,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload/preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.mainWindow.loadURL(`${browserPath}/main.html`);
            this.mainWindow.webContents.openDevTools({ mode: "detach" });
        } else {
            this.mainWindow.loadFile(`${browserPath}/main.html`);
        }

        this.ipcRendererRequest(this.mainWindow);
    }

    initInfoWindow() {
        this.infoWindow = new BrowserWindow({
            width: 600,
            height: 600,
            focusable: true,
            resizable: false,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload/preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.infoWindow.loadURL(`${browserPath}/info.html`);
            this.infoWindow.webContents.openDevTools({ mode: "detach" });
        } else {
            this.infoWindow.loadFile(`${browserPath}/info.html`);
        }

        this.ipcRendererRequest(this.infoWindow);
    }

    initMailViewWindow() {
        this.mailViewWindow = new BrowserWindow({
            width: 1050,
            height: 1000,
            focusable: true,
            resizable: true,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload/preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.mailViewWindow.loadURL(`${browserPath}/view.html`);
            this.mailViewWindow.webContents.openDevTools({ mode: "detach" });
        } else {
            this.mailViewWindow.loadFile(`${browserPath}/view.html`);
        }

        this.ipcRendererRequest(this.mailViewWindow);
    }

    ipcMainHook() {
        ipcMain.on("request-win-control", (_, [ action ]) => {
            const currentWindow = BrowserWindow.getFocusedWindow();
            if (!currentWindow) {
                return;
            }
            switch (action) {
                case "MAXIMUM":
                    currentWindow.maximize();
                    break;
                case "MINIMUM":
                    currentWindow.minimize();
                    break;
                case "UNMAXIMUM":
                    currentWindow.unmaximize();
                    break;
                case "CLOSE":
                    currentWindow.close();
                    break;
            }
        });

        ipcMain.on("request-main-login", async (_, [ userDto ]: [ UserDTO ]) => {
            if (this.mainWindow) {
                return;
            }

            this.userService = await user(userDto);

            if (this.entryWindow && this.userService) {
                this.entryWindow.close();
                this.entryWindow = undefined;
                this.initMainWindow();
                this.startObserver();
            }
        });

        ipcMain.on("request-logout", async () => {
            if (this.mainWindow && !this.entryWindow) {
                await this.streamManager.flush();
                if (this.updateTimer) {
                    clearInterval(this.updateTimer);
                    this.updateTimer = undefined;
                }
                for (const [ id, status ] of this.streamLoginMap.entries()) {
                    const status = this.streamLoginMap.get(id);
                    if (status && status === "LOGIN_SUCCESS") {
                        const stream = this.streamManager.stream(id);
                        if (stream) {
                            this.streamManager.remove(id);
                            stream.completeAllDisconnect();
                        }
                    }
                }

                this.userService = undefined;
                this.streamLoginMap.clear();
                this.mainWindow.close();
                this.mainWindow = undefined;
                this.userService = undefined;
                this.selectedStreamId = "";
                this.initEntryWindow();
            }
        });

        ipcMain.on("request-stream", async (_, [ streamDto ]: [ StreamDTO | undefined ]) => {
            if (!this.userService) {
                return;
            }

            if (this.mainWindow) {
                this.initInfoWindow();
                if (streamDto && this.infoWindow) {
                    this.infoWindow.webContents.once("did-finish-load", () => {
                        this.infoWindow!!.webContents.send("request-stream", streamDto);
                    });
                }
            }
        });

        ipcMain.on("request-mailview", async (_, [ mailDto ]: [ MailDTO ]) => {
            if (!this.userService) {
                return;
            }

            const streamDto = await this.userService.stream(mailDto.streamId);

            if (this.mainWindow && streamDto) {
                this.initMailViewWindow();
                if (this.mailViewWindow) {
                    this.mailViewWindow.webContents.once("did-finish-load", () => {
                        this.mailViewWindow!!.webContents.send("request-mailview", streamDto, mailDto);
                    });
                }
            }
        });

        ipcMain.on("request-close-mailview", async (_) => {
            if (!this.userService) {
                return;
            }

            if (this.mailViewWindow) {
                this.mailViewWindow.close();
                if (this.mainWindow) {
                    this.mainWindow.webContents.send("update-mail");
                }
            }
        });

        ipcMain.handle("create-user-account", async (_, [ userDto ]: [ UserDTO ]) => {
            if (await existsUser(userDto.id)) {
                return false;
            }

            await addUser(userDto);
            return true;
        });

        ipcMain.handle("login-user-account", async (_, [ userDto ]: [ UserDTO ]) => {
            return await user(userDto) !== undefined;
        });

        ipcMain.handle("get-all-streams", async (_) => {
            if (!this.userService) {
                return [];
            }

            const streamDtos = await this.userService.streams();
            
            return await Promise.all(streamDtos.map(async (streamDto) => {
                this.streamLoginMap.set(streamDto.streamId, "LOGIN");
                const stream = await this.createStream(streamDto.protocol, streamDto.streamId, streamDto.host, streamDto.port, streamDto.tls);

                try {
                    const login = stream ? await timeout(() => this.mailLogin(streamDto, stream), MAIL_LOGIN_TIMEOUT) : false;
                    this.streamLoginMap.set(streamDto.streamId, login ? "LOGIN_SUCCESS" : "LOGIN_FAIL");

                    return {
                        stream: { ...streamDto },
                        isError: !login,
                    };
                } catch(e) {
                    return {
                        stream: { ...streamDto },
                        isError: true,
                    };
                }
            }));
        });

        ipcMain.handle("read-mail", async (_, [ streamDto, mailDto ]: [ StreamDTO, MailDTO ]) => {
            if (!this.userService) {
                return;
            }

            const network = this.streamManager.stream(streamDto.streamId);
            const streamService = await this.userService.streamService(streamDto.streamId);
            if (!network || !streamService) {
                return;
            }

            const handler = network.handler();
            if (!handler) {
                return;
            }

            const contents = await (
                streamDto.protocol === "imap" ?
                this.imapFetchContents(mailDto.uid, handler as Handler<ImapCommandMap>) :
                this.pop3RetrContents(mailDto.fetchId.toString(), handler as Handler<Pop3CommandMap>)
            );

            if (!contents) {
                return;
            }

            await streamService.read(mailDto.uid);
            if (this.mainWindow) {
                this.mainWindow.webContents.send("update-mail");
            }

            return decodeMime(contents);
        });

        ipcMain.handle("get-mail-list-page", async (_, [ streamId, page, limit ]: [ string, number, number ]) => {
            if (!this.userService) {
                return;
            }

            const streamService = await this.userService.streamService(streamId);
            if (!streamService) {
                return;
            }

            this.selectedStreamId = streamId;
            const unseen = (await streamService.searchMails({
                seen: false
            })).length;

            const total = (await streamService.all()).length;

            if (this.mainWindow) { 
                this.mainWindow.webContents.send("get-total-mails", total);
                this.mainWindow.webContents.send("get-unseen-mails", unseen);

                if (streamService.stream.isNew) {
                    const streamDto: StreamDTO = {
                        ...streamService.stream,
                        isNew: false,
                    };

                    await streamService.updateStream(streamDto);
                
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: false,
                    });
                }
            }

            return await streamService.searchMails({
                pagenation: {
                    page,
                    limit,
                }
            });
        });

        ipcMain.handle("get-mail-list-filter", async (_, [ streamId, page, limit, filter ]: [ string, number, number, MailFilter ]) => {
            if (!this.userService) {
                return;
            }

            const streamService = await this.userService.streamService(streamId);
            if (!streamService) {
                return;
            }

            this.selectedStreamId = streamId;
            const unseen = (await streamService.searchMails({
                ...filter,
            })).length;

            const total = (await streamService.searchMails(filter)).length;

            if (this.mainWindow) { 
                this.mainWindow.webContents.send("get-total-mails", total);
                this.mainWindow.webContents.send("get-unseen-mails", unseen);

                if (streamService.stream.isNew) {
                    const streamDto: StreamDTO = {
                        ...streamService.stream,
                        isNew: false,
                    };

                    await streamService.updateStream(streamDto);
                
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: false,
                    });
                }
            }

            return await streamService.searchMails({
                pagenation: {
                    page,
                    limit,
                },
                ...filter
            });
        });

        ipcMain.handle("reload-stream", async (_, [ streamDto ]: [ StreamDTO ]) => {
            if (!this.userService) {
                return;
            }

            const stream = this.streamManager.stream(streamDto.streamId) as MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap>;

            if (!stream) {
                return false;
            }

            await stream.disconnect();

            try {
                const login = await timeout(() => this.mailLogin(streamDto, stream), MAIL_LOGIN_TIMEOUT);
                this.streamLoginMap.set(stream.id, login ? "LOGIN_SUCCESS" : "LOGIN_FAIL");

                return login;
            } catch(e) {
                this.streamLoginMap.set(stream.id, "LOGIN_FAIL");
                
                return false;
            } 
        });

        ipcMain.handle("insert-mail-address", async (_, [ mailId, mailPassword, protocol, hostname, port, tls, defaultName, aliasName, profileColor, notificate ]: [ string, string, string, string, number, boolean, string, string, string, boolean ]) => {
            if (!this.userService) {
                return;
            }
            
            const id = await this.streamManager.generateStreamID();
            const stream = await this.createStream(protocol, id, hostname, port, tls);

            if (!stream) {
                return undefined;
            }
            
            const streamDto: StreamDTO = {
                streamId: stream.id,
                mailId,
                mailPassword,
                protocol,
                host: hostname,
                port,
                tls,
                defaultName,
                aliasName,
                profileColor,
                notificate,
                isNew: false,
            };

            await this.userService.createStream(streamDto);
            try {
                const login = await timeout(() => this.mailLogin(streamDto, stream), MAIL_LOGIN_TIMEOUT);
                this.streamLoginMap.set(stream.id, login ? "LOGIN_SUCCESS" : "LOGIN_FAIL");
                if (this.mainWindow) {
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: !login,
                    });
                }
            } catch(e) {
                this.streamLoginMap.set(stream.id, "LOGIN_FAIL");
                if (this.mainWindow) {
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: false,
                    });
                }
            } 
            
            return streamDto;
        });

        ipcMain.handle("update-mail-address", async (_, [ streamDto ]: [ StreamDTO ]) => {
            if (!this.userService) {
                return false;
            }

            const streamService = await this.userService.streamService(streamDto.streamId);
            if (!streamService) {
                return false;
            }

            await streamService.updateStream(streamDto);
            const stream = this.streamManager.stream(streamDto.streamId) as MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap>;
            const newStream = await this.createStream(streamDto.protocol, streamDto.streamId, streamDto.host, streamDto.port, streamDto.tls);

            if (!stream || !newStream) {
                return false;
            }

            try {
                await stream.disconnect();
                const login = await timeout(() => this.mailLogin(streamDto, newStream), MAIL_LOGIN_TIMEOUT);

                if (this.mainWindow) {
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: login,
                    });
                }

                return true;
            } catch(e) {
                if (this.mainWindow) {
                    this.mainWindow.webContents.send("update-stream", {
                        stream: { ...streamDto },
                        isError: true,
                    });
                }
                return false;
            }
        });

        ipcMain.handle("delete-mail-address", async (_, [ streamId ]: [ string ]) => {
            if (!this.userService) {
                return false;
            }

            const streamService = await this.userService.streamService(streamId);
            if (!streamService) {
                return false;
            }

            const stream = this.streamManager.stream(streamId) as MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap>;
            const result = await this.userService.deleteStream(streamId);

            if (!stream) {
                return false;
            }

            await stream.disconnect();
            return result;
        });

        ipcMain.handle("read-range-mails", async (_, [ streamDto, range ]: [ StreamDTO, string[] ]) => {
            if (!this.userService) {
                return false;
            }

            return await this.readMail(streamDto, ...range);
        });

        ipcMain.handle("delete-range-mails", async (_, [ streamDto, range ]: [ StreamDTO, string[] ]) => {
            if (!this.userService) {
                return false;
            }

            return await this.deleteMail(streamDto, ...range);
        });

        ipcMain.handle("delete-mail", async (_, [ streamDto, id ]: [ StreamDTO, string ]) => {
            if (!this.userService) {
                return false;
            }

            return await this.deleteMail(streamDto, ...[ id ]);
        });
    }

    

    ipcRendererRequest(browserWindow: BrowserWindow) {
        browserWindow.on("minimize", () => {
            browserWindow.webContents.send("request-expand", false);
        });

        browserWindow.on("maximize", () => {
            browserWindow.webContents.send("request-expand", true);
        });
    }

    startObserver() {
        if (this.updateTimer) {
            return;
        }

        this.updateTimer = setInterval(async () => {
            this.updateQueue = this.updateQueue.then(async () => {
                if (!this.userService || !this.mainWindow) {
                    return;
                }

                const activeLoginStreams = [...this.streamLoginMap.entries()].filter(([_, status]) => status === "LOGIN_SUCCESS");

                for (const [ id, _ ] of activeLoginStreams) {
                    const update = this.updateMap.get(id);
                    if (update) {
                        if (update.type === "UPDATED" && Math.floor((Date.now() - update.doneTime) / 1000) >= 5) {
                            this.updateMap.delete(id);
                        }

                        continue;
                    }

                    await this.updateStream(id);
                }
            });
        }, UPDATE_INTERVAL);
    }

    async imapFetchContents(id: string, handler: Handler<ImapCommandMap>): Promise<ContentSchemaType | undefined> {
        const fetchResult = await handler.command("uid").execute("FETCH", {
            range: id,
            peek: "RFC822",
        });

        if (!safeUIDFetchResult(fetchResult, "RFC822")) {
            return;
        }

        const contents = fetchResult.schema.result.uidResult.fetch.fetchResult.fetchContent;
        if (contents.length === 0) {
            return;
        }

        await this.imapStoreFlag(handler, "+FLAGS", "\\Seen", id);

        return contents[0].mailContent.content;
    }

    async imapStoreFlag(handler: Handler<ImapCommandMap>, operation: FlagOperation, flag: Flag, range: string) {
        await handler.command("uid").execute("STORE", {
            operation,
            flag,
            range,
        });
    }

    async pop3RetrContents(id: string, handler: Handler<Pop3CommandMap>): Promise<ContentSchemaType | undefined> {
        const retrResult = await handler.command("retr").execute(parseInt(id));
        if (!safeResult(retrResult)) {
            return;
        }

        const contents = retrResult.schema.result.content;
        if (!contents) {
            return;
        }

        return contents;
    }

    async updateStream(streamId: string): Promise<boolean> {
        if (!this.userService) {
            return false;
        }

        const stream = this.streamManager.stream(streamId) as MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap>;
        const streamService = await this.userService.streamService(streamId);

        if (!stream || !streamService) {
            log({
                type: LogType.ERROR,
                tag: "Observer",
                context: `Stream(${streamId}) 이 감지되지 않았습니다. `
            });

            return false;
        }

        this.updateMap.set(streamId, {
            type: "PROCESSING",
            doneTime: 0,
        });

        if (streamService.stream.protocol === "imap") {
            await this.updateImapHistory(streamId, stream as MailNetwork<ImapCommandMap>);
        } else {
            await this.updatePop3History(streamId, stream as MailNetwork<Pop3CommandMap>);
        }

        const fetched = streamService.stream.protocol === "imap" ?
            await this.fetchImapHistory(streamId, stream as MailNetwork<ImapCommandMap>) :
            await this.fetchPop3History(streamId, stream as MailNetwork<Pop3CommandMap>);

        await streamService.updateStream(
            {
                ...streamService.stream,
                isNew: fetched > 0
            }
        );

        if (this.mainWindow) {
            if (streamService.stream.notificate && fetched) {
                if (!this.mainWindow.isFocused()) {
                    const notification = new Notification({
                        title: `${streamService.stream.aliasName} 계정 메일 알림`,
                        body: `총 ${fetched}건의 새로운 메일이 왔습니다!`
                    });

                    notification.on("click", () => {
                        this.mainWindow?.focus();
                    });
                    notification.show();
                }
                

                this.mainWindow.webContents.send("update-stream", {
                    stream: {
                        ...streamService.stream,
                        isNew: fetched
                    },
                    isError: false,
                });
            }
        }

        this.updateMap.set(streamId, {
            type: "UPDATED",
            doneTime: Date.now(),
        });

        return true;
    }

    async fetchImapHistory(streamId: string, network: MailNetwork<ImapCommandMap>): Promise<number> {
        if (!this.userService) {
            return 0;
        }

        const historyService = await this.userService.mailHistoryService(streamId);
        const streamService = await this.userService.streamService(streamId);
        const handler = network.handler();

        if (!historyService || !streamService || !handler) {
            return 0;
        }

        const latestHistory = await historyService.latestMailHistory("uid");

        try {
            const box = await findImapMailbox(handler);
            const selectResult = await handler.command("select").execute(box);
            if (!safeResult(selectResult)) {
                return 0;
            }

            const latestUID = await (async () => {
                const searchAllResult = await handler.command("uid").execute("SEARCH", createQuery().all());
                
                if (!safeUIDSearchResult(searchAllResult)) {
                    return 0;
                }

                const last = searchAllResult.schema.result.uidResult.searchResult.searchResult;
                return last ? last[last.length - 1] : 0;
            })();

            if (latestHistory && latestHistory.uid === latestUID.toString()) {
                return 0;
            }

            const flagResult = await handler.command("uid").execute("FETCH", {
                range: latestHistory ? `${parseInt(latestHistory.uid) + 1}:${latestUID}` : latestUID.toString(),
                peek: "FLAGS",
            });

            const dateResult = await handler.command("uid").execute("FETCH", {
                range: latestHistory ? `${parseInt(latestHistory.uid) + 1}:${latestUID}` : latestUID.toString(),
                peek: "INTERNALDATE",
            });

            const headerResult = await handler.command("uid").execute("FETCH", {
                range: latestHistory ? `${parseInt(latestHistory.uid) + 1}:${latestUID}` : latestUID.toString(),
                peek: "RFC822.HEADER",
            });

            if (
                !safeUIDFetchResult(flagResult, "FLAGS") ||
                !safeUIDFetchResult(dateResult, "INTERNALDATE") ||
                !safeUIDFetchResult(headerResult, "RFC822.HEADER")
            ) {
                return 0;
            }

            const flagFetches = flagResult.schema.result.uidResult.fetch.fetchResult.fetchFlag;
            const dateFetches = dateResult.schema.result.uidResult.fetch.fetchResult.fetchDate;
            const headerFetches = headerResult.schema.result.uidResult.fetch.fetchResult.fetchHeader;

            if (flagFetches.length != dateFetches.length || dateFetches.length != headerFetches.length) {
                return 0;
            }

            for (let i = 0; i < flagFetches.length; i++) {
                if (flagFetches[i].fetchUID != dateFetches[i].fetchUID || dateFetches[i].fetchUID != headerFetches[i].fetchUID) {
                    continue;
                } 
                const isSeen = flagFetches[i].flagSchema.flags.includes("\\Seen");
                const date = dateFetches[i].internalDate;
                const header = headerFetches[i].header;
                

                await historyService.insertMailHistory(0, flagFetches[i].fetchUID!!.toString());

                await streamService.newMail(
                    headerFetches[i].fetchID,
                    headerFetches[i].fetchUID!!.toString(),
                    isSeen,
                    date,
                    decodeWords(header.from),
                    decodeWords(header.subject),  
                );

                log({
                    type: LogType.INFO,
                    tag: "Observer",
                    context: `Stream(${streamId}) 에서 새로운 메일이 감지되었습니다 제목: ${header.subject}`,
                });
            }

            return flagFetches.length;
        } catch(e) {
            log({
                type: LogType.ERROR,
                tag: "Observer",
                context: `Stream(${streamId}) 에 오류가 발생하였습니다. 오류: ${e}`,
            });

            return 0;
        }
    }

    async updateImapHistory(streamId: string, network: MailNetwork<ImapCommandMap>) {
        if (!this.userService) {
            return;
        }

        const historyService = await this.userService.mailHistoryService(streamId);
        const streamService = await this.userService.streamService(streamId);
        const handler = await network.handler();

        if (!historyService || !streamService || !handler) {
            return;
        }

        const histories = await historyService.mailHistories("uid");

        try {
            const mailDtos = (await Promise.all(histories.map((history) => streamService.mail(history.uid)))).filter((value) => value != undefined);
            const findUIDs = await handler.command("uid").execute("SEARCH", createQuery().uid().range(mailDtos.map((dto) => dto.uid).join(",")));

            if (!safeUIDSearchResult(findUIDs)) {
                return;
            }

            const searchResults = findUIDs.schema.result.uidResult.searchResult;
            const unseenMailDtos = mailDtos.filter((dto) => searchResults.searchResult.includes(parseInt(dto.uid)) && !dto.isSeen);

            await Promise.all(
                mailDtos
                    .filter((dto) => !searchResults.searchResult.includes(parseInt(dto.uid)))
                    .map(async ({ uid }) => {
                        const deleteHistory = await historyService.deleteOneMailHistory(0, uid);
                        const deleteMail = await streamService.remove(uid);

                        if(!deleteHistory || !deleteMail) {
                            log({
                                type: LogType.ERROR,
                                tag: "Observer",
                                context: `Stream(${streamId}) 에서 삭제된 메일 UID(${uid}) 를 삭제하지 못했습니다.`,
                            });
                        } else {
                            log({
                                type: LogType.LOG,
                                tag: "Observer",
                                context: `Stream(${streamId}) 에서 삭제된 메일 UID(${uid}) 를 삭제했습니다.`,
                            });
                        }
                    })
            );

            const seenUIDs = await handler.command("uid").execute("SEARCH", createQuery().uid().range(unseenMailDtos.map((dto) => dto.uid).join(",")).seen());
            
            if (!safeUIDSearchResult(seenUIDs)) {
                return;
            }

            const seenResults = seenUIDs.schema.result.uidResult.searchResult.searchResult;
            const targetUIDs = await Promise.all(seenResults.map((seenUID) => streamService.mail(seenUID.toString())));
            await Promise.all(targetUIDs
                .filter((dto) => dto != undefined)
                .map(async ({ uid }) => {
                    await streamService.read(uid);
                })
            );
        } catch(e) {
            log({
                type: LogType.LOG,
                tag: "Observer",
                context: `Stream(${streamId}) 에서 오류가 발생하였습니다. 오류: ${e}`,
            });
        }
    }

    async fetchPop3History(streamId: string, network: MailNetwork<Pop3CommandMap>): Promise<number> {
        if (!this.userService) {
            return 0;
        }

        const historyService = await this.userService.mailHistoryService(streamId);
        const streamService = await this.userService.streamService(streamId);
        const handler = network.handler();

        if (!historyService || !streamService || !handler) {
            return 0;
        }

        const latest = await historyService.latestMailHistory("fetchId");

        try {
            await network.disconnect();
            this.streamLoginMap.set(streamId, "LOGIN");

            if (!await this.mailLogin(streamService.stream, network)) {
                this.streamLoginMap.set(streamId, "LOGIN_FAIL");
                return 0;
            }

            this.streamLoginMap.set(streamId, "LOGIN_SUCCESS");

            const uidlResult = await handler.command("uidl").execute();

            if (!safeResult(uidlResult)) {
                return 0;
            }

            if (!latest) {
                const last = uidlResult.schema.result.findLast((value) => value);
                if (!last) {
                    return 0;
                }

                const retrResult = await handler.command("retr").execute(last.seq);
                if (!safeResult(retrResult)) {
                    return 0;
                }

                await historyService.insertMailHistory(last.seq, last.uid);

                const { date, from, subject } = retrResult.schema.result;
                await streamService.newMail(
                    last.seq,
                    last.uid,
                    false,
                    date,
                    decodeWords(from),
                    decodeWords(subject)
                );

                log({
                    type: LogType.INFO,
                    tag: "Observer",
                    context: `Stream(${streamId}) 에서 새로운 메일을 감지하였습니다 제목: ${subject}`,
                });
            } else {
                const find = uidlResult.schema.result.findIndex((value) => value.uid === latest.uid);
                if (find + 1 >= uidlResult.schema.result.length) {
                    return 0;
                }

                const subUIDLs = uidlResult.schema.result.slice(find + 1);
                for (const uidl of subUIDLs) {
                    await historyService.insertMailHistory(uidl.seq, uidl.uid);
                    const retrResult = await handler.command("retr").execute(uidl.seq);
                    if (!safeResult(retrResult)) {
                        continue;
                    }
                    const { date, from, subject } = retrResult.schema.result;
                    await streamService.newMail(
                        uidl.seq,
                        uidl.uid,
                        false,
                        date,
                        decodeWords(from),
                        decodeWords(subject)
                    );

                    log({
                        type: LogType.INFO,
                        tag: "Observer",
                        context: `Stream(${streamId}) 에서 새로운 메일을 감지하였습니다 제목: ${subject}`,
                    });
                }

                return subUIDLs.length;
            }
        } catch(e) {
            log({
                type: LogType.ERROR,
                tag: "Observer",
                context: `Stream(${streamId}) 에서 오류가 발생하였습니다 오류: ${e}`,
            });

            return 0;
        }

        return 0;
    }

    async updatePop3History(streamId: string, network: MailNetwork<Pop3CommandMap>) {
        if (!this.userService) {
            return undefined;
        }

        const historyService = await this.userService.mailHistoryService(streamId);
        const streamService = await this.userService.streamService(streamId);
        const handler = network.handler();

        if (!historyService || !streamService || !handler) {
            return false;
        }

        const histories = await historyService.mailHistories("fetchId");

        if (histories.length === 0) {
            return;
        }

        try {
            await network.disconnect();
            this.streamLoginMap.set(streamId, "LOGIN");

            if (!await this.mailLogin(streamService.stream, network)) {
                this.streamLoginMap.set(streamId, "LOGIN_FAIL");
                return false;
            }
            const uidlResult = await handler.command("uidl").execute();

            if (!safeResult(uidlResult)) {
                return;
            }

            for (const history of histories) {
                const uidl = uidlResult.schema.result.find((value) => value.uid === history.uid);

                if (!uidl) {
                    const deleteHistory = await historyService.deleteOneMailHistory(history.fetchId, history.uid);
                    const deleteMail = await streamService.remove(history.uid);

                    if(!deleteHistory || !deleteMail) {
                        log({
                            type: LogType.ERROR,
                            tag: "Observer",
                            context: `Stream(${streamId}) 에서 삭제된 메일 UID(${history.uid}) 을 삭제하지 못했습니다.`,
                        });
                    } else {
                        log({
                            type: LogType.LOG,
                            tag: "Observer",
                            context: `Stream(${streamId}) 에서 삭제된 메일 UID(${history.uid}) 을 삭제하였습니다.`,
                        });
                    }
                } else {
                    if (uidl.seq != history.fetchId) {
                        await historyService.updateMailHistory(uidl.seq, uidl.uid);
                    }
                }
            }
                
        } catch(e) {
            log({
                type: LogType.LOG,
                tag: "Observer",
                context: `Stream(${streamId}) 에서 오류가 발생하였습니다 오류: ${e}`,
            });
        }
    }

    private async mailLogin(streamDto: StreamDTO, stream: MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap>): Promise<boolean> {
        try {
            if (stream.socketStatus === SocketStatus.DISCONNECT || 
                stream.socketStatus === SocketStatus.ERROR) {
                    await stream.connect();
            }
    
            if (streamDto.protocol === "imap") {
                const imapHandler = stream.handler() as Handler<ImapCommandMap> | undefined;
                if (!imapHandler) {
                    return false;
                }
                
                const loginResult = await imapHandler.command("login").execute(streamDto.mailId, streamDto.mailPassword);
                if (loginResult.schema.error) {
                    return false;
                }

                const box = await findImapMailbox(imapHandler);
                const selectResult = await imapHandler.command("select").execute(box);
                if (selectResult.schema.error) {
                    return false;
                }
            }
    
            if (streamDto.protocol === "pop3") {
                const pop3Handler = stream.handler() as Handler<Pop3CommandMap> | undefined;
                if (!pop3Handler) {
                    return false;
                }

                const loginResult = await pop3Handler.command("user").execute(streamDto.mailId).then((_) => {
                    return pop3Handler.command("pass").execute(streamDto.mailPassword);
                });
    
                if(loginResult.schema.error) {
                    return false;
                }
            }
    
            return true;
        } catch(e) {
            return false;
        }
    }

    async readMail(streamDto: StreamDTO, ...range: string[]): Promise<boolean> {
        if (!this.userService) {
            return false;
        }

        const streamService = await this.userService.streamService(streamDto.streamId);
        if (!streamService) {
            return false;
        }

        if (streamDto.protocol === "imap") {
            const network = this.streamManager.stream(streamDto.streamId);
            if (!network) {
                return false;
            }

            const handler = network.handler();
            if (!handler) {
                return false;
            }

            await this.imapStoreFlag(handler, "+FLAGS", "\\Seen", range.join(","));
        }

        await streamService.readRange(streamDto.protocol === "imap" ? "uid" : "fetchId", range);
        return true;
    }

    async deleteMail(streamDto: StreamDTO, ...range: string[]): Promise<boolean> {
        if (!this.userService) {
            return false;
        }

        const streamService = await this.userService.streamService(streamDto.streamId);
        if (!streamService) {
            return false;
        }

        if (streamDto.protocol === "imap") {
            const network = this.streamManager.stream(streamDto.streamId);
            if (!network) {
                return false;
            }

            const handler = network.handler();
            if (!handler) {
                return false;
            }

            await this.imapStoreFlag(handler, "+FLAGS", "\\Deleted", range.join(","));
        }

        await streamService.removeRange(streamDto.protocol === "imap" ? "uid" : "fetchId", range);
        return true;
    }

    private async createStream(protocol: string, streamId: string, hostname: string, port: number, secure: boolean): Promise<MailNetwork<ImapCommandMap> | MailNetwork<Pop3CommandMap> | undefined> {
        return await protocol === "imap" ?
        this.streamManager.createStream(
            new ImapCommandMap(),
            {
                commandTransform: new ImapTransform(streamId),
                parser: new ImapParser(streamId),
            },
            {
                hostname,
                port,
                secure,
                tls: {
                    rejectUnauthorized: false,
                },
            },
            streamId
        ) : this.streamManager.createStream(
            new Pop3CommandMap(),
            {
                commandTransform: new Pop3Transform(),
                parser: new Pop3Parser(),
            },
            {
                hostname,
                port,
                secure,
                tls: {
                    rejectUnauthorized: false,
                },
            },
            streamId
        );
    }
}