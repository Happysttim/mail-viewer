import { PassThrough } from "node:stream";
import { CommandMap, CommandName } from "lib/type";
import { TransformCallback } from "stream";
import { QueueMessage } from "lib/command/queue";
import log from "../logger";
import { LogType } from "../logger/logger";

export default class CommandMemory<T extends CommandMap> extends PassThrough {

    private commandQueue: CommandName<T>[] = [];
    private readonly tag = "CommandMemory";

    constructor() {
        super(
            {
                objectMode: true
            }
        );
    }

    _transform(chunk: QueueMessage<T>, encoding: BufferEncoding, callback: TransformCallback): void {
        this.memory(chunk.command);
        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `${chunk.command.toString()} 저장`,
            }
        );
        callback(null, chunk);
    }

    memory<Command extends CommandName<T>>(command: Command) {
        this.commandQueue.push(command);
    }

    async forget(): Promise<CommandName<T> | undefined> {
        return this.commandQueue.shift();
    }

}