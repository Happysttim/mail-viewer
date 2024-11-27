import log from "src/lib/logger";
import ImapCommandMap from "../../../command/imap";
import { QueueMessage } from "../../../command/queue";
import Handler, { Status } from "../handler";
import { LogType } from "src/lib/logger/logger";
import MailNetwork from "../../network/network";
import { TransformCallback } from "stream";

export default class ImapHandler extends Handler<ImapCommandMap> {

    private readonly imapCommand: ImapCommandMap;
    private readonly tag = "ImapHandler";

    constructor(network: MailNetwork) {
        super(network);
        this.imapCommand = new ImapCommandMap();
    }

    _transform(chunk: QueueMessage<ImapCommandMap>, encoding: BufferEncoding, callback: TransformCallback): void {
        switch (chunk.command) {
            case "login":
                this.add(this.imapCommand.login(chunk.args[0]));
            break;
            case "fetch":

            break;
            case "list":

            break;
            case "logout":

            break;
            case "select":

            break;
            case "status":

            break;
        }

        this.suffix();
        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `${chunk.command} ${chunk.args} 명령어 전송`,
            }
        );
        callback(null, this.command());
    }
}