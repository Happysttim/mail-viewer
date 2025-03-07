import { CommandArgs, CommandMap, CommandName } from "lib/type";
import CommandQueue from "lib/command/queue";
import CommandTransform from "lib/stream/transform";
import { StreamEvent } from "lib/event/stream";

export default class Handler<T extends CommandMap> {

    readonly id: string;

    private promiseCommandQueue: Promise<void> = Promise.resolve();
    private commandQueue: CommandQueue<T> = new CommandQueue();
    private commandTransform: CommandTransform<T>;
    private streamEvent: StreamEvent<T>;

    constructor(
        id: string,
        commandTransform: CommandTransform<T>,
        streamEvent: StreamEvent<T>,
    ) {
        this.id = id;
        this.commandTransform = commandTransform;
        this.streamEvent = streamEvent;
    }

    command<
        Name extends CommandName<T>
    >(
        name: Name,
    ) {
        return {
            execute: <Args extends CommandArgs<T, Name>>(...args: Args): Promise<void> => {
                this.commandQueue.addQueue(name, ...args);
                return new Promise((resolve, reject) => {
                    this.promiseCommandQueue = this.promiseCommandQueue.then(async () => {
                        const message = await this.commandQueue.removeQueue();
                        if (message && this.commandTransform.write(message)) {
                            this.streamEvent.emit("command-handler-success", this.id, message.command, message.args);
                            resolve();
                        } else {
                            this.streamEvent.emit("command-handler-fail", this.id);
                            reject();
                        }
                    });
                });
            }
        };
    }

    async flush() {
        await this.promiseCommandQueue;
    } 

}