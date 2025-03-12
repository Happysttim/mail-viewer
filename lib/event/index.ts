import { EventEmitter } from "events";
import { CommandMap, CommandName, Result } from "lib/type";
import { uid } from "uid";

class CommandEvent extends EventEmitter {

    public generateCommandId(): string {
        return uid(6);
    }

    once<Map extends CommandMap, Command extends CommandName<Map>>(eventName: string, listener: (error: boolean, result: Result<Map, Command>) => void): this {
        return super.once(eventName, listener);
    }

    emit<Map extends CommandMap, Command extends CommandName<Map>>(eventName: string, error: boolean, result: Result<Map, Command>): boolean {
        return super.emit(eventName, error, result);
    }

}

export const commandEvent = new CommandEvent();