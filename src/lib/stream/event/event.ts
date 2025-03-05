import EventEmitter from "events";
import { SocketStatus } from "../network";
import { HostOption } from "lib/object/network/host-option";
import { CommandArgs, CommandMap, CommandName, Zod } from "lib/type";

type EventMap<
    Map extends CommandMap = CommandMap
> = {
    "socket-status": (hostOption: HostOption, previous: SocketStatus, now: SocketStatus) => void;
    "stream-pipeline": (hostOption: HostOption, cause: NodeJS.ErrnoException | null) => void;
    "create-stream": (protocol: string, hostOption: HostOption, id: string) => void;
    "command-transfer-store": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(commandName: Command | undefined, args: Args | undefined) => void;
    "command-transfer-forget": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(commandName: Command | undefined, args: Args | undefined) => void;
    "command-receiver-schema": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(protocol: string, hostOption: HostOption, commandName: Command, args: Args, schema: Zod) => void;
    "command-receiver-schema-error": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(protocol: string, hostOption: HostOption, commandName: Command, args: Args) => void;
};
type EventName = keyof EventMap;
type EventCallbackArgs<K extends EventName, Map extends CommandMap> = Parameters<EventMap<Map>[K]>;

class StreamEvent extends EventEmitter {

    on<K extends EventName, Map extends CommandMap = CommandMap>(eventName: K, listener: (...args: EventCallbackArgs<K, Map>) => void): this {
        return super.on(eventName, listener);
    }

    emit<K extends EventName, Map extends CommandMap = CommandMap>(eventName: K, ...args: EventCallbackArgs<K, Map>): boolean {
        return super.emit(eventName, ...args);
    }

    removeListener<K extends EventName, Map extends CommandMap = CommandMap>(eventName: K, listener: (...args: EventCallbackArgs<K, Map>) => void): this {
        return super.removeListener(eventName, listener);
    }

}

const streamEvent = new StreamEvent();
export default streamEvent;