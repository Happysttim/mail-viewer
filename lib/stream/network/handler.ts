import { CommandArgs, CommandMap, CommandName, Result } from "lib/type";
import { CommandQueue } from "lib/command";
import { CommandTransform } from "lib/stream/transform";
import { commandEvent } from "lib/event";

export class Handler<T extends CommandMap> {

    private promiseCommandQueue: Promise<void> = Promise.resolve();
    private commandQueue: CommandQueue<T> = new CommandQueue();
    private commandTransform: CommandTransform<T>;

    constructor(
        commandTransform: CommandTransform<T>,
    ) {
        this.commandTransform = commandTransform;
    }

    command<Name extends CommandName<T>>(name: Name) {
        return {
            execute: <Args extends CommandArgs<T, Name>>(...args: Args): Promise<Result<T, Name>> => {
                this.commandQueue.addQueue(commandEvent.generateCommandId(), name, ...args);
                return new Promise((resolve, reject) => {
                    this.promiseCommandQueue = this.promiseCommandQueue.then(async () => {
                        const message = await this.commandQueue.removeQueue();
                        if (message && this.commandTransform.write(message)) {
                            commandEvent.once<T, Name>(message.id, (error, result) => {
                                error ? resolve(result) : reject();
                            });
                        } else {
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