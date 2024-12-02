import { Duplex, PassThrough, Transform } from "node:stream";
import { TransformCallback } from "stream";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { CommandMap } from "lib/type";
import CommandMemory from "./memory";

export default class Receiver<T extends CommandMap> extends Transform {

    private readonly tag = "Receiver";
    private readonly commandMemory: CommandMemory<T>;
    private promiseCommandMemory: Promise<void> = Promise.resolve();
    private ignoreWelcome = false;
    private reroll = false;
    private previousCommand: string = "";

    constructor(
        commandMemory: CommandMemory<T>
    ) {
        super();
        this.commandMemory = commandMemory;
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

            if (chunk.length < this.writableHighWaterMark) {
                this.reroll = false;
            }

            return callback();
        }

        this.promiseCommandMemory = this.promiseCommandMemory.then(async () => {
            const memory = await this.commandMemory.forget();
            if (memory) {
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `${memory.toString()} 명령어 결과 크기: ${chunk.length}`
                    }
                );
                
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: chunk.toString("utf-8")
                    }
                );

                this.previousCommand = memory.toString();
                if (chunk.length >= this.readableHighWaterMark) {
                    this.reroll = true;
                }
            }

            callback();
        });
    }

    _flush(callback: TransformCallback): void {
        callback();
    }

}