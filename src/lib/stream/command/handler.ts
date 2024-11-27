import { Transform } from "node:stream";
import MailNetwork from "../network/network";
import { TransformCallback } from "stream";
import { CommandMap } from "src/lib/command/command";
import { QueueMessage } from "src/lib/command/queue";
import log from "src/lib/logger";
import { LogType } from "src/lib/logger/logger";

export enum Status {
    ERROR = "ERROR",
    LOGIN = "LOGIN",
    PREPARE = "PREPARE",
    PROCESS_COMMAND = "PROCESS_COMMAND",
}

export default abstract class Handler<T extends CommandMap> extends Transform {
    protected status!: Status;
    private commands: string[] = [];

    constructor() {
        super(
            {
                objectMode: true
            }
        );
        this.status = Status.LOGIN;
    }

    protected suffix() {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            this.commands[last] += "\r\n";
        }
    }

    protected add(command: string) {
        this.commands.push(command);
    }

    protected command(): string {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            return this.commands[last];
        }

        return "";
    }

    protected dumpCommands(tag: string) {
        log(
            {
                tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------COMMAND DUMP`,
            }
        );
        this.commands.forEach(command => {
            log(
                {
                    tag,
                    type: LogType.DEBUG,
                    context: command,
                }
            );
        });
        log(
            {
                tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------END`,
            }
        );
    }

    abstract _transform(chunk: QueueMessage<T>, encoding: BufferEncoding, callback: TransformCallback): void;
}