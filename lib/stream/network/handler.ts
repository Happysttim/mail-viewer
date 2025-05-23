import { CommandArgs, CommandMap, CommandName, Result } from "lib/type";
import { CommandQueue } from "lib/command";
import { CommandTransform } from "lib/stream/transform";
import { commandEvent } from "lib/event";
import EventEmitter from "node:events";
import { StringValidation } from "zod";

export class Handler<T extends CommandMap> extends EventEmitter {

    private promiseCommandQueue: Promise<void> = Promise.resolve();
    private commandQueue: CommandQueue<T> = new CommandQueue();
    private commandTransform: CommandTransform<T>;

    latestCommandId: string;

    constructor(
        commandTransform: CommandTransform<T>,
    ) {
        super();
        this.commandTransform = commandTransform;
        this.latestCommandId = "";
    }

    command<Name extends CommandName<T>>(name: Name) {
        return {
            execute: <Args extends CommandArgs<T, Name>>(...args: Args): Promise<Result<T, Name>> => {
                this.latestCommandId = commandEvent.generateCommandId();
                this.commandQueue.addQueue(this.latestCommandId, name, ...args);
                return new Promise((resolve, reject) => {
                    this.promiseCommandQueue = this.promiseCommandQueue.then(async () => {
                        const message = await this.commandQueue.removeQueue();
                        if (message && this.commandTransform.write(message)) {
                            commandEvent.once<T, Name>(message.id, (hasSchema, result) => {
                                if (hasSchema) {
                                    this.emit(message.command, result);
                                    resolve(result);
                                } else {
                                    reject("no schema");
                                }
                            });
                        } else {
                            reject("write fail");
                        }
                    });
                });
            },
        };
    }

    on<Command extends CommandName<T>>(eventName: Command, listener: (result: Result<T, Command>) => void): this {
        return super.on(eventName, listener);
    }

    once<Command extends CommandName<T>>(eventName: Command, listener: (result: Result<T, Command>) => void): this {
        return super.once(eventName, listener);
    }

    emit<Command extends CommandName<T>>(eventName: Command, result: Result<T, Command>): boolean {
        return super.emit(eventName, result);
    }

    async flush() {
        await this.promiseCommandQueue;
    } 

}