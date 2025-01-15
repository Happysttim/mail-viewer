import log from "lib/logger";
import ImapCommandMap from "lib/command/imap";
import { QueueMessage } from "lib/command/queue";
import CommandTransform from "../transform";
import { LogType } from "lib/logger/logger";
import { TransformCallback } from "stream";
import { CommandArgs, CommandName } from "lib/type";

export default class ImapTransform extends CommandTransform<ImapCommandMap> {

    private readonly imapCommand: ImapCommandMap;
    private readonly tag = "ImapTransfer";
    private readonly imapTag;

    constructor(imapTag: string) {
        super();
        this.imapTag = imapTag;
        this.imapCommand = new ImapCommandMap();
    }

    private transformCommand<
        Command extends CommandName<ImapCommandMap>, 
        Args extends CommandArgs<ImapCommandMap, Command>>
        (
            command: Command,
            args: Args
        ): string {
            switch (command) {
                case "capability":
                    return `${this.imapTag} CAPABILITY`;
                case "expunge":
                    return `${this.imapTag} EXPUNGE`;
                case "fetch":
                    return `${this.imapTag} FETCH ${args[0]} ${args[1]}`;
                case "idle":
                    return `${this.imapTag} IDLE`;
                case "list":
                    return `${this.imapTag} LIST ${args[0]} ${args[1]}`;
                case "login":
                    return `${this.imapTag} LOGIN ${args[0]} ${args[1]}`;
                case "logout":
                    return `${this.imapTag} LOGOUT`;
                case "noop":
                    return `${this.imapTag} NOOP`;
                case "search":
                    return `${this.imapTag} SEARCH ${args[0]}`;
                case "select":
                    return `${this.imapTag} SELECT ${args[0]}`;
                case "status":
                    return `${this.imapTag} STATUS ${args[0]} ${args[1]}`;
                case "store":
                    return `${this.imapTag} STORE ${args[0]} ${args[1]}`;
                case "uid":
                    return `${this.imapTag} UID ${args[0]} ${args[1]} ${args[2]}`;
            }
        }


    _transform(chunk: QueueMessage<ImapCommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.addCommand(this.transformCommand(chunk.command, chunk.args));
        switch (chunk.command) {
            case "capability":
                this.addResultStore(this.imapCommand.capability());
                break;
            case "expunge":
                this.addResultStore(this.imapCommand.expunge());
                break;
            case "fetch":
                this.addResultStore(this.imapCommand.fetch(chunk.args[0], chunk.args[1]));
                break;
            case "idle":
                this.addResultStore(this.imapCommand.idle());
                break;
            case "list":
                this.addResultStore(this.imapCommand.list(chunk.args[0], chunk.args[1]));
                break;
            case "login":
                this.addResultStore(this.imapCommand.login(chunk.args[0], chunk.args[1]));
                break;
            case "logout":
                this.addResultStore(this.imapCommand.logout());
                break;
            case "noop":
                this.addResultStore(this.imapCommand.noop());
                break;
            case "search":
                this.addResultStore(this.imapCommand.search(chunk.args[0]));
                break;
            case "select":
                this.addResultStore(this.imapCommand.select(chunk.args[0]));
                break;
            case "status":
                this.addResultStore(this.imapCommand.status(chunk.args[0], chunk.args[1]));
                break;
            case "store":
                this.addResultStore(this.imapCommand.store(chunk.args[0], chunk.args[1]));
                break;
            case "uid":
                this.addResultStore(this.imapCommand.uid(chunk.args[0], chunk.args[1], chunk.args[2]));
                break;
        }

        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `${this.command()} 명령어 전송`,
            }
        );
        this.suffix();
        callback(null, this.command());
    }
}