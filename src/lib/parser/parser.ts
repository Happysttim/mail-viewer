import { CommandArgs, CommandMap, CommandName, CommandResult } from "lib/type";
import { z, ZodObject, ZodTypeAny } from "zod";

type Zod = ZodObject<{[key: string]: ZodTypeAny}>;

export default abstract class Parser<T extends CommandMap> {
    
    protected commandResult!: CommandResult<T, CommandName<T>, Zod>;
    protected buffer: Buffer = Buffer.from([]);

    get command(): CommandName<T> {
        return this.commandResult!!.command;
    }

    get args(): CommandArgs<T, CommandName<T>> {
        return this.commandResult!!.args;
    }

    checkResult(): boolean {
        return this.commandResult !== undefined;
    }

    abstract eof(): boolean;
    abstract schema(): z.infer<typeof this.commandResult.schema> | undefined;
    
    concatBuffer(buffer: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, buffer]);
    }

    flushAndChange(result: CommandResult<T, CommandName<T>, Zod>): void {
        this.buffer.fill(0);
        this.buffer = Buffer.from([]);

        this.commandResult = result;
    }

}