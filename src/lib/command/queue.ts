import { CommandArgs, CommandMap, CommandName } from "lib/type";

export type QueueMessage<T extends CommandMap> = {
    [P in CommandName<T>]: {
        id: string;
        command: P;
        args: CommandArgs<T, P>;
    }
}[CommandName<T>];

export type CommandCallback<T extends CommandMap> = ((message: QueueMessage<T>) => Promise<void>);

export class CommandQueue<T extends CommandMap> {

    private commandQueue: QueueMessage<T>[] = [];

    addQueue<Name extends CommandName<T>>(id: string, command: Name, ...args: CommandArgs<T, Name>) {
        const message: QueueMessage<T> = {
            id,
            command,
            args
        };
        this.commandQueue.push(message);
    }

    async removeQueue(): Promise<QueueMessage<T> | undefined> {
        const message = this.commandQueue.shift();

        if (message === undefined) {
            return undefined;
        }

        return message;
    }

}