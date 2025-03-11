import { CommandMap, IdResult } from "lib/type";
import { z } from "zod";

export abstract class Parser<T extends CommandMap> {
    
    protected idResult!: IdResult<T>;
    protected buffer: Buffer = Buffer.from([]);

    get result(): IdResult<T> {
        return this.idResult!!;
    }

    checkResult(): boolean {
        return this.idResult !== undefined;
    }

    schema(): boolean {
        if (this.checkResult()) {
            const safeParse = this.receiveSchema();
            if (safeParse) {
                this.idResult.commandResult.schema = (safeParse.error ? {  
                    error: true
                } : safeParse.data);
                return true;
            }
        }
        return false;
    }

    abstract eof(): boolean;
    protected abstract receiveSchema(): z.SafeParseReturnType<typeof this.idResult.commandResult.schema, typeof this.idResult.commandResult.schema> | undefined;
    
    concatBuffer(buffer: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, buffer]);
    }

    flushAndChange(result: IdResult<T>): void {
        this.buffer.fill(0);
        this.buffer = Buffer.from([]);

        this.idResult = result;
    }

}