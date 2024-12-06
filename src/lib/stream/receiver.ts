import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { CommandMap } from "lib/type";
import CommandTransform from "./transform";

export default class Receiver<T extends CommandMap> extends Transform {

    private readonly tag = "Receiver";
    private readonly commandTransform: CommandTransform<T>;
    private promiseCommandTransform: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;
    private reroll = false;
    private previousCommand: string = "";

    constructor(
        commandTransform: CommandTransform<T>
    ) {
        super();
        this.commandTransform = commandTransform;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        if (!this.ignoreWelcome) {
            this.ignoreWelcome = true;
            return callback();
        }

        if (this.reroll) {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `${this.previousCommand} 명령어 결과 크기: ${chunk.length}`
                }
            );
            
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: chunk.toString("utf-8")
                }
            );

            return callback();
        }

        this.promiseCommandTransform = this.promiseCommandTransform.then(async () => {
            const schema = await this.commandTransform.forgotResult();
            if (schema) {
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `${schema.command.toString()} 명령어 결과 크기: ${chunk.length}`
                    }
                );
                
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: chunk.toString("utf-8")
                    }
                );

                this.previousCommand = schema.toString();
            }

            callback();
        });
    }

    _flush(callback: TransformCallback): void {
        callback();
    }

}