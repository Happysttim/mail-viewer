import { CommandArgs, CommandMap, CommandName } from "lib/type";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";

export type QueueMessage<T extends CommandMap> = {
    [P in CommandName<T>]: {
        command: P;
        args: CommandArgs<T, P>;
    }
}[CommandName<T>];

export type CommandCallback<T extends CommandMap> = ((message: QueueMessage<T>) => Promise<void>);

export class CommandQueue<T extends CommandMap> {

    private commandQueue: QueueMessage<T>[] = [];
    private readonly tag = "CommandQueue";

    addQueue<Name extends CommandName<T>>(command: Name, ...args: CommandArgs<T, Name>) {
        const message: QueueMessage<T> = {
            command,
            args
        };
        this.commandQueue.push(message);
    }

    async removeQueue(): Promise<QueueMessage<T> | undefined> {
        const message = this.commandQueue.shift();

        if (message === undefined) {
            log(
                {
                    type: LogType.ERROR,
                    tag: this.tag,
                    context: "커멘드 큐의 요소가 없습니다.",
                }
            );
            return undefined;
        }

        return message;
    }

}