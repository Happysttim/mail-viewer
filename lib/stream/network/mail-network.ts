import { connect as tcp_connect, Socket } from "node:net";
import { connect as tls_connect, TLSSocket } from "node:tls";
import { pipeline } from "node:stream";
import { CommandTransform } from "lib/stream/transform";
import Receiver from "lib/stream/receiver";
import { CommandMap, HostOption } from "lib/type";
import { Handler } from "./";
import { Parser } from "lib/parser";
import EventEmitter from "node:events";
import { commandEvent } from "lib/event";

export enum SocketStatus {
    CONNECTING = "CONNECTING",
    ERROR = "ERROR",
    DISCONNECT = "DISCONNECT",
    CONNECTED = "CONNECTED"
}

type SocketLike = Socket | TLSSocket | undefined;
type EventMap = {
    "socket-status": (previous: SocketStatus, now: SocketStatus) => void;
    "socket-error": (cause: string) => void;
    "stream-pipeline-error": (cause: NodeJS.ErrnoException | null) => void;
};
type EventName = keyof EventMap;
type EventCallbackArgs<K extends EventName> = Parameters<EventMap[K]>;

export class MailNetwork<T extends CommandMap = CommandMap> extends EventEmitter {

    readonly hostOption: HostOption;
    readonly id: string;

    private socket: SocketLike;
    private commandMap: T;
    private commandTransform: CommandTransform<T>;
    private parser: Parser<T>;
    private receiver: Receiver<T>;
    private commandHandler: Handler<T> | undefined = undefined;
    
    private status: SocketStatus = SocketStatus.DISCONNECT;

    constructor(
        id: string,
        commandMap: T,
        commandTransform: CommandTransform<T>,
        parser: Parser<T>,
        hostOption: HostOption,
    ) {
        super();
        this.id = id;
        this.commandMap = commandMap;
        this.commandTransform = commandTransform;
        this.parser = parser;
        this.hostOption = hostOption;
        this.receiver = new Receiver(this.commandTransform, this.parser);
        this.setSocketStatus(SocketStatus.DISCONNECT);
    }

    get socketStatus(): SocketStatus {
        return this.status;
    }

    handler(): Handler<typeof this.commandMap> | undefined {
        return this.commandHandler;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.commandHandler = new Handler(this.commandTransform);
                
                this.socket = this.hostOption.secure ? tls_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                        rejectUnauthorized: this.hostOption.tls?.rejectUnauthorized ?? false,
                    }
                ) : tcp_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                    }
                );

                this.commandTransform.pipe(this.socket, { end: false });
                this.socket.pipe(this.receiver, { end: false });

                this.socket.once("connect", () => {
                    this.setSocketStatus(SocketStatus.CONNECTED);
                    resolve();
                });
        
                this.socket.once("error", (err) => {
                    if (err) {
                        console.log(err);
                        this.setSocketStatus(SocketStatus.DISCONNECT);
                        this.emit("socket-error", err);
                        reject(err);
                    }
                });
            } catch(err) {
                console.log(`ERROR ${err}`);
                this.setSocketStatus(SocketStatus.ERROR);
                reject(err);
            }
        });
    }

    disconnect(): Promise<boolean> {
        return new Promise((resolve, _) => {
            if (this.socket && this.status == SocketStatus.CONNECTED) {
                this.socket.end(() => {
                    this.setSocketStatus(SocketStatus.DISCONNECT);
                    resolve(true);
                });
                this.commandTransform.flush();
            } else {
                resolve(false);
                this.emit("socket-error", "Wrong disconnect request. cause: invalid socket");
            }
        });
    }

    completeAllDisconnect(): void {
        if (this.socket && !this.socket.destroyed) {
            this.socket.destroy();
        }

        if (!this.commandTransform.destroyed) {
            this.commandTransform.destroy();
        }

        if (!this.receiver.destroyed) {
            this.receiver.destroy();
        }
    }

    on<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K>) => void): this {
        return super.on(eventName, listener);
    }

    emit<K extends EventName>(eventName: K, ...args: EventCallbackArgs<K>): boolean {
        return super.emit(eventName, ...args);
    }

    removeListener<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K>) => void): this {
        return super.removeListener(eventName, listener);
    }

    private setSocketStatus(status: SocketStatus) {
        const previous = this.status;
        this.status = status;
        this.emit("socket-status", previous, status);
    }

}