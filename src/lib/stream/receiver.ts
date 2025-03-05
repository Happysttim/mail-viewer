import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { CommandMap, CommandName, CommandResult } from "lib/type";
import CommandTransform from "./transform/transform";
import Parser from "lib/parser/parser";
import { ZodObject, ZodTypeAny } from "zod";
import { HostOption } from "lib/object/network/host-option";
import streamEvent from "./event/event";

type CommandResultLike<T extends CommandMap> = CommandResult<T, CommandName<T>, ZodObject<{[key: string]: ZodTypeAny}>>;
type EOFType = "UNDEFINED" | "EOF" | "NOT_EOF";

export default class Receiver<T extends CommandMap> extends Transform {

    readonly protocol: string;
    readonly hostOption: HostOption;

    private readonly tag = "Receiver";
    private readonly commandTransform: CommandTransform<T>;
    private readonly parser: Parser<T>;
    
    private promiseCommandTransform: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;
    private usingSchema = false;

    private previousCommand: string = "";

    constructor(
        commandTransform: CommandTransform<T>,
        parser: Parser<T>,
        protocol: string,
        hostOption: HostOption
    ) {
        super();
        this.commandTransform = commandTransform;
        this.parser = parser;
        this.protocol = protocol;
        this.hostOption = hostOption;
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
                if (schema instanceof ZodObject) {
                    streamEvent.emit<"command-receiver-schema", T>("command-receiver-schema", this.protocol, this.hostOption, this.parser.command, this.parser.args, schema);
                } else {
                    streamEvent.emit<"command-receiver-schema-error", T>("command-receiver-schema-error", this.protocol, this.hostOption, this.parser.command, this.parser.args);
                }
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `${this.previousCommand} 명령어 결과: ${JSON.stringify(schema, null, 2)}`
                    }
                );

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