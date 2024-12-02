import { CommandArgs, CommandMap, CommandName } from "lib/type";
import CommandQueue from "lib/command/queue";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import CommandMemory from "./memory";

export default class Handler<T extends CommandMap> {

    private promiseCommandQueue: Promise<void> = Promise.resolve();
    private readonly commandQueue: CommandQueue<T> = new CommandQueue();
    private readonly commandMemory: CommandMemory<T>;
    private readonly tag = "Handler";

    constructor(
        commandMemory: CommandMemory<T>
    ) {
        this.commandMemory = commandMemory;
    }

    command<
            Name extends CommandName<T>, 
            Args extends CommandArgs<T, Name>
        >(
            name: Name, 
            ...args: Args
        ) {
        this.commandQueue.addQueue(name, ...args);
        this.promiseCommandQueue = this.promiseCommandQueue.then(async () => {
            const message = await this.commandQueue.removeQueue();
            if (message && this.commandMemory.write(message)) {
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `명령어 전송 성공 정보: ${JSON.stringify(message)}`,
                    }
                );
            } else {
                log(
                    {
                        tag: this.tag,
                        type: LogType.ERROR,
                        context: "명령어 전송 실패",
                    }
                );
            }
        });
    }

    async flush() {
        await this.promiseCommandQueue;
    } 

}