import EventEmitter from "events";
import { SocketStatus } from "lib/stream/network/mail-network";
import { HostOption } from "lib/object/network/host-option";
import { CommandArgs, CommandMap, CommandName, CommandResult, Zod } from "lib/type";
import { z } from "zod";

type EventMap<
    Map extends CommandMap = CommandMap
> = {
    "socket-status": (id: string, previous: SocketStatus, now: SocketStatus) => void;
    "socket-error": (id: string, cause: string) => void;
    "unknown-command-map": () => void;
    "stream-pipeline-error": (id: string, cause: NodeJS.ErrnoException | null) => void;
    "create-stream": (protocol: string, hostOption: HostOption, id: string) => void;
    "command-handler-success": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(id: string, commandName: Command, args: Args) => void;
    "command-handler-fail": (id: string) => void;
    "command-transfer-store": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(commandName: Command, args: Args) => void;
    "command-transfer-forget": <
        Command extends CommandName<Map>, 
        Args extends CommandArgs<Map, Command>
    >(commandName: Command, args: Args) => void;
    "command-receiver-schema": <
        Command extends CommandName<Map>, 
        Result extends CommandResult<Map, Command, z.infer<Zod>>
    >(id: string, result: Result) => void;
    "command-receiver-schema-error": <
        Command extends CommandName<Map>, 
        Result extends CommandResult<Map, Command, z.infer<Zod>>
    >(id: string, result: Result) => void;
};
type EventName = keyof EventMap;
type EventCallbackArgs<K extends EventName, Map extends CommandMap> = Parameters<EventMap<Map>[K]>;

class StreamEvent<Map extends CommandMap = CommandMap> extends EventEmitter {

    on<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K, Map>) => void): this {
        return super.on(eventName, listener);
    }

    emit<K extends EventName>(eventName: K, ...args: EventCallbackArgs<K, Map>): boolean {
        return super.emit(eventName, ...args);
    }

    removeListener<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K, Map>) => void): this {
        return super.removeListener(eventName, listener);
    }

}

const streamEvent = new StreamEvent();
export { streamEvent, StreamEvent };