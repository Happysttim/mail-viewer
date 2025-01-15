import log from "lib/logger";
import { QueueMessage } from "../../command/queue";
import CommandTransform from "../transform";
import { LogType } from "lib/logger/logger";
import MailNetwork from "../network";
import { TransformCallback } from "stream";
import Pop3CommandMap from "lib/command/pop3";
import { CommandArgs, CommandName } from "lib/type";

export default class Pop3Transform extends CommandTransform<Pop3CommandMap> {

    private readonly pop3CommandMap: Pop3CommandMap;
    private readonly tag = "Pop3Transform";

    constructor() {
        super();
        this.pop3CommandMap = new Pop3CommandMap();
    }

    private transformCommand<
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
                    return `STAT`;
                case "dele":
                    return `DELE ${args[0]}`;
                case "quit":
                    return `QUIT`;
                case "uidl":
                    return `UIDL`;
                default:
                    return ""
            }
        }

    _transform(chunk: QueueMessage<Pop3CommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.addCommand(this.transformCommand(chunk.command, chunk.args));
        switch (chunk.command) {
            case "user":
                this.addResultStore(this.pop3CommandMap.user(chunk.args[0]));
            break;
            case "pass":
                this.addResultStore(this.pop3CommandMap.pass(chunk.args[0]));
            break;
            case "list":
                this.addResultStore(this.pop3CommandMap.list(chunk.args[0]));
            break;
            case "dele":
                this.addResultStore(this.pop3CommandMap.dele(chunk.args[0]));
            break;
            case "quit":
                this.addResultStore(this.pop3CommandMap.quit());
            break;
            case "retr":
                this.addResultStore(this.pop3CommandMap.retr(chunk.args[0]));
            break;
            case "stat":
                this.addResultStore(this.pop3CommandMap.stat());
            break;
            case "uidl":
                this.addResultStore(this.pop3CommandMap.uidl());
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