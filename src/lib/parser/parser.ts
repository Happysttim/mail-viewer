import { CommandMap, CommandName, CommandResult } from "lib/type";
import { z, ZodObject, ZodTypeAny } from "zod";

type Zod = ZodObject<{[key: string]: ZodTypeAny}>;

export abstract class Parser<T extends CommandMap> {
    
    protected commandResult!: CommandResult<T, CommandName<T>, z.infer<Zod>>;
    protected buffer: Buffer = Buffer.from([]);

    get result(): CommandResult<T, CommandName<T>, z.infer<Zod>> {
        return this.commandResult!!;
    }

    checkResult(): boolean {
        return this.commandResult !== undefined;
    }

    schema(): boolean {
        if (this.checkResult()) {
            const schema = this.receiveSchema();
            if (schema) {
                this.commandResult.schema = schema as typeof this.commandResult.schema;
                return true;
            }
        }
        return false;
    }

    abstract eof(): boolean;
    protected abstract receiveSchema(): typeof this.commandResult.schema | undefined;
    
    concatBuffer(buffer: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, buffer]);
    }

    flushAndChange(result: CommandResult<T, CommandName<T>, z.infer<Zod>>): void {
        this.buffer.fill(0);
        this.buffer = Buffer.from([]);

        this.commandResult = result;
    }

}