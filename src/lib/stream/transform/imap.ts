import log from "lib/logger";
import ImapCommandMap from "lib/command/imap";
import { QueueMessage } from "lib/command/queue";
import CommandTransform from "../transform";
import { LogType } from "lib/logger/logger";
import { TransformCallback } from "stream";

export default class ImapTransform extends CommandTransform<ImapCommandMap> {

    private readonly imapCommand: ImapCommandMap;
    private readonly tag = "ImapTransform";

    constructor() {
        super();
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