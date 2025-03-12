import { SearchQuery } from "lib/command/imap";
import { QueueMessage } from "lib/command/queue";
import { CommandTransform } from "lib/stream/transform";
import { TransformCallback } from "stream";
import { CommandArgs, CommandName } from "lib/type";
import { CopyArgument, StoreArgument, FetchArgument } from "lib/command/imap/type";
import { ImapCommandMap } from "lib/command";

export class ImapTransform extends CommandTransform<ImapCommandMap> {

    private readonly imapCommand: ImapCommandMap;
    private readonly imapTag;

    constructor(imapTag: string) {
        super();
        this.imapTag = imapTag;
        this.imapCommand = new ImapCommandMap();
    }

    protected transformCommand<
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
                    return `${this.imapTag} SEARCH ${args[0]} ${(args[1] as SearchQuery).queryString}`;
                case "select":
                    return `${this.imapTag} SELECT ${args[0]}`;
                case "status":
                    return `${this.imapTag} STATUS ${args[0]} ${args[1]}`;
                case "store":
                    return `${this.imapTag} STORE ${args[0]} ${args[1]}`;
                case "uid":
                    switch (args[0]) {
                        case "SEARCH":
                            return `${this.imapTag} UID SEARCH ${(args[1] as SearchQuery).queryString}`;
                        case "STORE": {
                            const storeArgs = args[1] as StoreArgument;
                            return `${this.imapTag} UID STORE ${storeArgs.operation} ${storeArgs.flag}`;
                        }
                        case "FETCH": {
                            const fetchArgs = args[1] as FetchArgument;
                            return `${this.imapTag} UID FETCH ${fetchArgs.range} ${fetchArgs.peek}`;
                        }
                        case "COPY":
                        case "MOVE": {
                            const criteriaArgs = args[1] as CopyArgument;
                            return `${this.imapTag} UID ${args[0]} ${criteriaArgs.range} ${criteriaArgs.mailBox}`;
                        }
                        case "EXPUNGE":
                            return `${this.imapTag} UID EXPUNGE ${args[1]}`;
                        default:
                            return "";
                    }
            }
        }


    _transform(chunk: QueueMessage<ImapCommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.addCommand(this.transformCommand(chunk.command, chunk.args));
        switch (chunk.command) {
            case "capability":
                this.addResultStore(chunk.id, this.imapCommand.capability());
                break;
            case "expunge":
                this.addResultStore(chunk.id, this.imapCommand.expunge());
                break;
            case "fetch":
                this.addResultStore(chunk.id, this.imapCommand.fetch(chunk.args[0], chunk.args[1]));
                break;
            case "idle":
                this.addResultStore(chunk.id, this.imapCommand.idle());
                break;
            case "list":
                this.addResultStore(chunk.id, this.imapCommand.list(chunk.args[0], chunk.args[1]));
                break;
            case "login":
                this.addResultStore(chunk.id, this.imapCommand.login(chunk.args[0], chunk.args[1]));
                break;
            case "logout":
                this.addResultStore(chunk.id, this.imapCommand.logout());
                break;
            case "noop":
                this.addResultStore(chunk.id, this.imapCommand.noop());
                break;
            case "search":
                this.addResultStore(chunk.id, this.imapCommand.search(chunk.args[0], chunk.args[1]));
                break;
            case "select":
                this.addResultStore(chunk.id, this.imapCommand.select(chunk.args[0]));
                break;
            case "status":
                this.addResultStore(chunk.id, this.imapCommand.status(chunk.args[0], chunk.args[1]));
                break;
            case "store":
                this.addResultStore(chunk.id, this.imapCommand.store(chunk.args[0], chunk.args[1]));
                break;
            case "uid":
                this.addResultStore(chunk.id, this.imapCommand.uid(chunk.args[0], chunk.args[1]));
                break;
        }

        this.suffix();
        callback(null, this.command());
    }
}