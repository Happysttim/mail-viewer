import { CommandMap, CommandName, CommandResult, Zod } from "lib/type";
import { EventEmitter } from "stream";
import { z } from "zod";

export class SchemaEvent<Map extends CommandMap> extends EventEmitter {

    emit<Command extends CommandName<Map>, Result extends CommandResult<Map, CommandName<Map>, z.infer<Zod>>>(eventName: Command, id: string, result: Result): boolean {
        return super.emit(eventName, id, result);
    }

    on<Command extends CommandName<Map>, Result extends CommandResult<Map, CommandName<Map>, z.infer<Zod>>>(eventName: Command, listener: (id: string, result: Result) => void): this {
        return super.on(eventName, listener);
    }

}