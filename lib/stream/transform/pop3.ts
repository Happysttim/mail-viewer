import { QueueMessage } from "lib/command/queue";
import { CommandTransform } from "lib/stream/transform";
import { TransformCallback } from "stream";
import { Pop3CommandMap } from "lib/command";
import { CommandArgs, CommandName } from "lib/type";

export class Pop3Transform extends CommandTransform<Pop3CommandMap> {

    private readonly pop3CommandMap: Pop3CommandMap;

    constructor() {
        super();
        this.pop3CommandMap = new Pop3CommandMap();
    }

    protected transformCommand<
        Command extends CommandName<Pop3CommandMap>, 
        Args extends CommandArgs<Pop3CommandMap, Command>>
        (
            command: Command,
            args: Args
        ): string {
            switch (command) {
                case "user":
                    return `USER ${args[0]}`;
                case "pass":
                    return `PASS ${args[0]}`;
                case "list":
                    return `LIST ${args[0] ?? ""}`;
                case "retr":
                    return `RETR ${args[0]}`;
                case "stat":
                    return "STAT";
                case "dele":
                    return `DELE ${args[0]}`;
                case "quit":
                    return "QUIT";
                case "uidl":
                    return `UIDL ${args[0] ?? ""}`;
                default:
                    return "";
            }
        }

    _transform(chunk: QueueMessage<Pop3CommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.addCommand(this.transformCommand(chunk.command, chunk.args));
        switch (chunk.command) {
            case "user":
                this.addResultStore(chunk.id, this.pop3CommandMap.user(chunk.args[0]));
            break;
            case "pass":
                this.addResultStore(chunk.id, this.pop3CommandMap.pass(chunk.args[0]));
            break;
            case "list":
                this.addResultStore(chunk.id, this.pop3CommandMap.list(chunk.args[0]));
            break;
            case "dele":
                this.addResultStore(chunk.id, this.pop3CommandMap.dele(chunk.args[0]));
            break;
            case "quit":
                this.addResultStore(chunk.id, this.pop3CommandMap.quit());
            break;
            case "retr":
                this.addResultStore(chunk.id, this.pop3CommandMap.retr(chunk.args[0]));
            break;
            case "stat":
                this.addResultStore(chunk.id, this.pop3CommandMap.stat());
            break;
            case "uidl":
                this.addResultStore(chunk.id, this.pop3CommandMap.uidl(chunk.args[0]));
            break;
        }

        this.suffix();
        callback(null, this.command());
    }
}