import { CommandMap, CommandName, CommandResult, Zod } from "lib/type";
import { EventEmitter } from "stream";
import { z } from "zod";

type EventMap<
    Map extends CommandMap, 
    Result extends CommandResult<Map, CommandName<Map>, z.infer<Zod>>
> = {
    [P in CommandName<Map>]: Result
}
type Result<Map extends CommandMap, Command extends CommandName<Map>> = EventMap<Map, CommandResult<Map, Command, z.infer<Zod>>>[Command];

export default class SchemaEvent<Map extends CommandMap> extends EventEmitter {

    emit<Command extends CommandName<Map>>(eventName: Command, id: string, result: Result<Map, Command>): boolean {
        return super.emit(eventName, id, result);
    }

    on<Command extends CommandName<Map>>(eventName: Command, listener: (id: string, result: Result<Map, Command>) => void): this {
        return super.on(eventName, listener);
    }
    

}