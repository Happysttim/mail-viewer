import { Transform, TransformCallback } from "node:stream";
import { CommandArgs, CommandMap, CommandName, CommandResult, IdResult, Zod } from "lib/type";
import { QueueMessage } from "lib/command/queue";
import { z } from "zod";

export class CommandTransform<T extends CommandMap> extends Transform {

    private commands: string[] = [];
    private resultStore: IdResult<T>[] = [];

    constructor() {
        super(
            {
                objectMode: true
            }
        );
    }

    protected transformCommand<
        Command extends CommandName<T>, 
        Args extends CommandArgs<T, Command>>(
            command: Command,
            args: Args
        ): string {
            return "";
    }

    protected suffix() {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            this.commands[last] += "\r\n";
        }
    }

    protected addCommand(command: string) {
        this.commands.push(command);
    }

    protected addResultStore<Command extends CommandName<T>>(id: string, commandResult: CommandResult<T, Command, z.infer<Zod>>) {
        this.resultStore.push({
            id,
            commandResult
        });
    }

    forgetResult(): IdResult<T> | undefined {
        return this.resultStore.shift();
    }

    protected command(): string {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            return this.commands[last];
        }

        return "";
    }

    _transform(chunk: QueueMessage<T>, encoding: BufferEncoding, callback: TransformCallback): void {
        
    }
}