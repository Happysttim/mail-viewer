import { connect as tcp_connect, Socket } from "node:net";
import { connect as tls_connect, TLSSocket } from "node:tls";
import { pipeline } from "node:stream";
import CommandTransform from "lib/stream/transform";
import { HostOption } from "lib/object/network/host-option";
import Receiver from "lib/stream/receiver";
import { CommandMap } from "lib/type";
import Handler from "./handler";
import Parser from "lib/parser/parser";
import { streamEvent, StreamEvent } from "lib/stream/event";
import { uid } from "uid";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";

export enum SocketStatus {
    CONNECTING = "CONNECTING",
    ERROR = "ERROR",
    DISCONNECT = "DISCONNECT",
    CONNECTED = "CONNECTED"
}
type SocketLike = Socket | TLSSocket | undefined;

export default class MailNetwork<T extends CommandMap> {

    readonly hostOption: HostOption;
    readonly protocol: string;
    readonly prefix: string;
    readonly id: string;

    private readonly tag = "MailNetwork";
    
    private socket: SocketLike;
    private commandMap: T;
    private commandTransform: CommandTransform<T>;
    private parser: Parser<T>;
    private commandHandler: Handler<T> | undefined = undefined;
    private status: SocketStatus = SocketStatus.DISCONNECT;
    private streamEvent: StreamEvent<T>;

    constructor(
        protocol: string,
        prefix: string,
        hostOption: HostOption,
        commandMap: T,
        commandTransform: CommandTransform<T>,
        parser: Parser<T>
    ) {
        this.commandTransform = commandTransform;
        this.parser = parser;
        this.commandMap = commandMap;
        this.protocol = protocol;
        this.hostOption = hostOption;
        this.prefix = prefix;
        this.id = this.prefix + uid(16);
        this.streamEvent = new StreamEvent();
        this.setSocketStatus(SocketStatus.CONNECTING);

        this.initEvent();

        streamEvent.emit("create-stream", this.protocol, this.hostOption, this.id);
    }

    handler(): Handler<typeof this.commandMap> | undefined {
        return this.commandHandler;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const receiver = new Receiver(this.id, this.commandTransform, this.parser, this.streamEvent);
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
                    this.commandHandler = new Handler(this.id, this.commandTransform, this.streamEvent);
                    resolve();
                    pipeline(this.commandTransform, this.socket!!, receiver, err => {
                        streamEvent.emit("stream-pipeline-error", this.id, err);
                    });
                });
        
                this.socket.on("error", err => {
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
            streamEvent.emit("socket-error", this.id, "Wrong disconnect request. cause: invalid socket");
        }
    }

    private setSocketStatus(status: SocketStatus) {
        const previous = this.status;
        this.status = status;
        streamEvent.emit("socket-status", this.id, previous, status);
    }

    private initEvent() {
        this.streamEvent.on("command-handler-fail", id => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Stream(${id}) command handle is failed`,
                }
            );
        });
        this.streamEvent.on("command-handler-success", (id, commandName, args) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Stream(${id}) command(${commandName.toString()} ${args}) handled`,
                }
            );
        });
        this.streamEvent.on("command-receiver-schema", (id, commandName, args, schema) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Stream(${id}) command(${commandName.toString()} ${args}) result: ${JSON.stringify(schema, null, 2)}`
                }
            );
        });
        this.streamEvent.on("command-receiver-schema-error", (id, commandName, args) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `Stream(${id}) command(${String(commandName)} ${args}) error has occurred`
                }
            );
        });
    }

}