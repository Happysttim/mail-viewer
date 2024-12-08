import { CommandMap, CommandName, CommandResult } from "lib/type";
import { z, ZodObject, ZodTypeAny } from "zod";

type Zod = ZodObject<{[key: string]: ZodTypeAny}>;

export default abstract class Parser<T extends CommandMap> {
    
    protected commandResult!: CommandResult<T, CommandName<T>, Zod>;

    checkResult(): boolean {
        return this.commandResult !== undefined;
    }

    abstract eof(): boolean;
    abstract schema(): z.infer<typeof this.commandResult.schema> | undefined;
    abstract concatBuffer(buffer: Buffer): void;
    abstract flushAndChange(result: CommandResult<T, CommandName<T>, Zod>): void;
}