import { connect as tcp_connect, Socket } from "node:net";
import { connect as tls_connect, TLSSocket } from "node:tls";
import { pipeline } from "node:stream";
import { CommandTransform } from "lib/stream/transform";
import Receiver from "lib/stream/receiver";
import { CommandMap, HostOption } from "lib/type";
import { Handler } from "./";
import { Parser } from "lib/parser";
import EventEmitter from "node:events";

export enum SocketStatus {
    CONNECTING = "CONNECTING",
    ERROR = "ERROR",
    DISCONNECT = "DISCONNECT",
    CONNECTED = "CONNECTED"
}

type SocketLike = Socket | TLSSocket | undefined;
type EventMap = {
    "socket-status": (previous: SocketStatus, now: SocketStatus) => void;
    "socket-error": (cause: string) => void;
    "stream-pipeline-error": (cause: NodeJS.ErrnoException | null) => void;
};
type EventName = keyof EventMap;
type EventCallbackArgs<K extends EventName> = Parameters<EventMap[K]>;

export class MailNetwork<T extends CommandMap> extends EventEmitter {

    readonly hostOption: HostOption;
    readonly id: string;

    private socket: SocketLike;
    private commandMap: T;
    private commandTransform: CommandTransform<T>;
    private parser: Parser<T>;
    private commandHandler: Handler<T> | undefined = undefined;
    private status: SocketStatus = SocketStatus.DISCONNECT;

    constructor(
        id: string,
        commandMap: T,
        commandTransform: CommandTransform<T>,
        parser: Parser<T>,
        hostOption: HostOption,
    ) {
        super();
        this.id = id;
        this.commandMap = commandMap;
        this.commandTransform = commandTransform;
        this.parser = parser;
        this.hostOption = hostOption;
        this.setSocketStatus(SocketStatus.CONNECTING);
    }

    handler(): Handler<typeof this.commandMap> | undefined {
        return this.commandHandler;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const receiver = new Receiver(this.commandTransform, this.parser);
                this.socket = this.hostOption.secure ? tls_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                        rejectUnauthorized: this.hostOption.tls?.rejectUnauthorized ?? true,
                    }
                ) : tcp_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                    }
                );
        
                this.socket.once("connect", () => {
                    this.setSocketStatus(SocketStatus.CONNECTED);
                    this.commandHandler = new Handler(this.commandTransform);
                    resolve();
                    pipeline(this.commandTransform, this.socket!!, receiver, err => {
                        this.emit("stream-pipeline-error", err);
                    });
                });
        
                this.socket.on("error", err => {
                    this.emit("socket-error", err);
                    this.setSocketStatus(SocketStatus.ERROR);
                });
            } catch(err) {
                this.socket = undefined;
                this.setSocketStatus(SocketStatus.ERROR);
                reject(err);
            }
        });
    }

    disconnect() {
        if (this.socket && this.status == SocketStatus.CONNECTED) {
            this.socket.end(() => {
                this.setSocketStatus(SocketStatus.DISCONNECT);
                this.socket = undefined;
            });
        } else {
            this.emit("socket-error", "Wrong disconnect request. cause: invalid socket");
        }
    }

    on<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K>) => void): this {
        return super.on(eventName, listener);
    }

    emit<K extends EventName>(eventName: K, ...args: EventCallbackArgs<K>): boolean {
        return super.emit(eventName, ...args);
    }

    removeListener<K extends EventName>(eventName: K, listener: (...args: EventCallbackArgs<K>) => void): this {
        return super.removeListener(eventName, listener);
    }

    private setSocketStatus(status: SocketStatus) {
        const previous = this.status;
        this.status = status;
        this.emit("socket-status", previous, status);
    }

}