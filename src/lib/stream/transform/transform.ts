import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import { CommandArgs, CommandMap, CommandName, CommandResult } from "lib/type";
import { QueueMessage } from "lib/command/queue";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { ZodObject, ZodTypeAny } from "zod";
import streamEvent from "../event/event";

export default class CommandTransform<T extends CommandMap> extends Transform {

    private commands: string[] = [];
    private resultStore: CommandResult<T, CommandName<T>, ZodObject<{[key: string]: ZodTypeAny}>>[] = [];

    constructor() {
        super(
            {
                objectMode: true
            }
        );
    }

    protected transformCommand<
        Command extends CommandName<T>, 
        Args extends CommandArgs<T, Command>>(
            command: Command,
            args: Args
        ): string {
            return "";
    }

    protected suffix() {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            this.commands[last] += "\r\n";
        }
    }

    protected addCommand(command: string) {
        this.commands.push(command);
    }

    protected addResultStore(schema: CommandResult<T, CommandName<T>, ZodObject<{[key: string]: ZodTypeAny}>>) {
        streamEvent.emit<"command-transfer-store", T>("command-transfer-store", schema.command, schema.args);
        this.resultStore.push(schema);
    }

    async forgetResult(): Promise<CommandResult<T, CommandName<T>, ZodObject<{[key: string]: ZodTypeAny}>> | undefined> {
        const result = this.resultStore.shift();
        streamEvent.emit<"command-transfer-store", T>("command-transfer-store", result?.command, result?.args);
        
        return result;
    }

    protected command(): string {
        const last = this.commands.length - 1;
        if (this.commands.length > 0) {
            return this.commands[last];
        }

        return "";
    }

    protected dumpCommands(tag: string) {
        log(
            {
                tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------COMMAND DUMP`,
            }
        );
        this.commands.forEach(command => {
            log(
                {
                    tag,
                    type: LogType.DEBUG,
                    context: command,
                }
            );
        });
        log(
            {
                tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------END`,
            }
        );
    }

    _transform(chunk: QueueMessage<T>, encoding: BufferEncoding, callback: TransformCallback): void {
        
    }
}