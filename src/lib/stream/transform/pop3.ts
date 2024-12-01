import log from "lib/logger";
import { QueueMessage } from "../../command/queue";
import CommandTransform from "../transform";
import { LogType } from "lib/logger/logger";
import MailNetwork from "../network";
import { TransformCallback } from "stream";
import Pop3CommandMap from "lib/command/pop3";

export default class Pop3Transform extends CommandTransform<Pop3CommandMap> {

    private readonly pop3CommandMap: Pop3CommandMap;

    private readonly tag = "Pop3Transform";

    constructor() {
        super();
        this.pop3CommandMap = new Pop3CommandMap();
    }

    _transform(chunk: QueueMessage<Pop3CommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        switch (chunk.command) {
            case "user":
                this.add(this.pop3CommandMap.user(chunk.args[0]));
            break;
            case "pass":
                this.add(this.pop3CommandMap.pass(chunk.args[0]));
            break;
            case "list":
                this.add(this.pop3CommandMap.list(chunk.args[0]));
            break;
            case "dele":

            break;
            case "quit":
                this.add(this.pop3CommandMap.quit());
            break;
            case "retr":
                this.add(this.pop3CommandMap.retr(chunk.args[0]));
            break;
            case "stat":
                this.add(this.pop3CommandMap.stat());
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