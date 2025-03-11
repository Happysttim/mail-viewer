import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import { CommandMap, IdResult } from "lib/type";
import { CommandTransform } from "./transform";
import { Parser } from "lib/parser";
import { commandEvent } from "lib/event";

type EOFType = "UNDEFINED" | "EOF" | "NOT_EOF";

export default class Receiver<T extends CommandMap> extends Transform {

    private readonly tag = "Receiver";
    
    private commandTransform: CommandTransform<T>;
    private parser: Parser<T>;
    private promiseCommandTransform: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;
    private usingSchema = false;

    constructor(
        commandTransform: CommandTransform<T>,
        parser: Parser<T>,
    ) {
        super();
        this.commandTransform = commandTransform;
        this.parser = parser;
    }

    _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if (!this.ignoreWelcome) {
            this.ignoreWelcome = true;
            return callback();
        }

        this.promiseCommandTransform = this.promiseCommandTransform.then(async () => {
            if (this.parserEOF() === "UNDEFINED" || this.usingSchema) {
                const result = await this.commandTransform.forgetResult();
                this.parserFlushAndChange(result, chunk);

                this.usingSchema = false;
            } else if (this.parserEOF() === "NOT_EOF") {
                this.concatChunk(chunk);
            }

            if (this.parserEOF() === "EOF") {
                const error = this.parser.schema();
                commandEvent.emit(this.parser.result.id, error, this.parser.result.commandResult);
                this.usingSchema = true;
            }

            callback();
        });
    }

    _flush(callback: TransformCallback): void {
        callback();
    }

    private parserFlushAndChange(result: IdResult<T> | undefined, chunk: Buffer): boolean {
        if (result) {
            this.parser.flushAndChange(result);
            this.parser.concatBuffer(chunk);
            return true;
        }

        return false;
    }

    private concatChunk(chunk: Buffer, result?: IdResult<T>) {
        if (this.parser.checkResult()) {
            this.parser.concatBuffer(chunk);
            return;
        }

        this.parserFlushAndChange(result, chunk);
    }

    private parserEOF(): EOFType {
        if (this.parser.checkResult()) {
            return this.parser.eof() ? "EOF" : "NOT_EOF";
        }

        return "UNDEFINED";
    }

}