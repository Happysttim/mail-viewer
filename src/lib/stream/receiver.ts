import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { CommandMap } from "lib/type";
import CommandTransform from "./transform";
import Parser from "lib/parser/parser";

export default class Receiver<T extends CommandMap> extends Transform {

    private readonly tag = "Receiver";
    private readonly commandTransform: CommandTransform<T>;
    private readonly parser: Parser<T>;
    private promiseCommandTransform: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;

    private previousCommand: string = "";

    constructor(
        commandTransform: CommandTransform<T>,
        parser: Parser<T>
    ) {
        super();
        this.commandTransform = commandTransform;
        this.parser = parser;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        if (!this.ignoreWelcome) {
            this.ignoreWelcome = true;
            return callback();
        }

        if (this.parser.checkResult()) {
            if (!this.parser.eof()) {
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `${this.previousCommand} 명령어 결과 크기: ${chunk.length}`
                    }
                );
                this.parser.concatBuffer(chunk);
                return callback();
            }
        }

        this.promiseCommandTransform = this.promiseCommandTransform.then(async () => {
            const schema = await this.commandTransform.forgotResult();
            if (schema) {
                this.parser.flushAndChange(schema);
                this.parser.concatBuffer(chunk);
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `${schema.command.toString()} 명령어 결과 크기: ${chunk.length}`
                    }
                );
                this.previousCommand = schema.command.toString();

                if (this.parser.eof()) {
                    const schema = this.parser.schema();
                
                    log(
                        {
                            tag: this.tag,
                            type: LogType.INFO,
                            context: `명령어 결과: ${JSON.stringify(schema)}`
                        }
                    );
                }
            }

            callback();
        });
    }

    _flush(callback: TransformCallback): void {
        callback();
    }

}