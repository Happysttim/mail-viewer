import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import { CommandMap, CommandName, CommandResult, Zod } from "lib/type";
import CommandTransform from "./transform";
import Parser from "lib/parser/parser";
import { ZodObject, ZodTypeAny } from "zod";
import { StreamEvent } from "./event";

type CommandResultLike<T extends CommandMap> = CommandResult<T, CommandName<T>, ZodObject<{[key: string]: ZodTypeAny}>>;
type EOFType = "UNDEFINED" | "EOF" | "NOT_EOF";

export default class Receiver<T extends CommandMap> extends Transform {

    readonly id: string;

    private readonly tag = "Receiver";
    
    private commandTransform: CommandTransform<T>;
    private parser: Parser<T>;
    private streamEvent: StreamEvent<T>;
    private promiseCommandTransform: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;
    private usingSchema = false;
    private previousCommand = "";

    constructor(
        id: string,
        commandTransform: CommandTransform<T>,
        parser: Parser<T>,
        streamEvent: StreamEvent<T>,
    ) {
        super();
        this.id = id;
        this.commandTransform = commandTransform;
        this.parser = parser;
        this.streamEvent = streamEvent;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
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
                const schema = this.parser.schema();
                if (schema) {
                    this.streamEvent.emit("command-receiver-schema", this.id, this.parser.command, this.parser.args, schema as Zod);
                } else {
                    this.streamEvent.emit("command-receiver-schema-error", this.id, this.parser.command, this.parser.args);
                }
                this.usingSchema = true;
            }

            callback();
        });
    }

    _flush(callback: TransformCallback): void {
        callback();
    }

    private parserFlushAndChange(schema: CommandResultLike<T> | undefined, chunk: Buffer): boolean {
        if (schema) {
            this.parser.flushAndChange(schema);
            this.parser.concatBuffer(chunk);

            this.previousCommand = schema.command.toString(); 
            return true;
        }

        return false;
    }

    private concatChunk(chunk: Buffer, schema?: CommandResultLike<T> | undefined) {
        if (this.parser.checkResult()) {
            this.parser.concatBuffer(chunk);
            return;
        }

        this.parserFlushAndChange(schema, chunk);
    }

    private parserEOF(): EOFType {
        if (this.parser.checkResult()) {
            return this.parser.eof() ? "EOF" : "NOT_EOF";
        }

        return "UNDEFINED";
    }

}