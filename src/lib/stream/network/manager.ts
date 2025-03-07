import MailNetwork from "lib/stream/network/mail-network";
import { CommandMap } from "lib/type";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import CommandTransform from "lib/stream/transform/index";
import Parser from "lib/parser/parser";
import { HostOption } from "lib/object/network/host-option";
import { streamEvent } from "lib/event/stream";

type Pipe<T extends CommandMap> = {
    commandTransform: CommandTransform<T>;
    parser: Parser<T>;
    prefix: string;
}
type PipeMap<T extends CommandMap = CommandMap> = Map<new () => T, Pipe<T>>;
type NetworkMap<T extends CommandMap = CommandMap> = Map<string, MailNetwork<T>>;

export default class StreamManager {

    private readonly tag = "StreamManager";

    private pipeMap: PipeMap<any> = new Map();
    private networkMap: NetworkMap<any> = new Map();

    constructor() {
        this.initEvent();
    }

    register<T extends CommandMap>(commandMap: new () => T, pipe: Pipe<T>) {
        this.pipeMap.set(commandMap, pipe);
    }

    createStream<T extends CommandMap>(commandMap: new () => T, hostOption: HostOption) {
        const pipe = this.pipeMap.get(commandMap);
        const command = new commandMap();
        if (!pipe) {
            streamEvent.emit("unknown-command-map");
            return undefined;
        }

        const stream = new MailNetwork<T>(
            command.__protocol,
            pipe.prefix,
            hostOption,
            command,
            pipe.commandTransform,
            pipe.parser
        );

        this.networkMap.set(stream.id, stream);
        return stream;
    }

    stream(id: string): MailNetwork<any> | undefined {
        return this.networkMap.get(id);
    }

    async flushAllHandler() {
        for(const [_, value] of Object.entries(this.networkMap)) {
            const handler = value.handler();
            if (handler) {
                await handler.flush();
            }
        };
    }

    dumpNetworkUIDLog() {
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: "-----------------------------------START NETWORK UID LOG"
            }
        );

        Object.entries(this.networkMap).forEach(value => {
            log(
                {
                    tag: this.tag,
                    type: LogType.DEBUG,
                    context: `Network UID: ${value[0]}`
                }
            );
        });

        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: "-----------------------------------END LOG"
            }
        );
    }

    private initEvent() {
        streamEvent.on("socket-status", (id, previous, now) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Detected socket(${id}) status: ${previous} -> ${now}`
                }
            );

            if (now === "DISCONNECT") {
                this.networkMap.delete(id);
            }
        });

        streamEvent.on("socket-error", (id, cause) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Socket(${id}) error cause: ${cause}`
                }
            );
        });

        streamEvent.on("create-stream", (protocol, hostOption, id) => {
            log(
                {
                    tag: this.tag,
                    type: LogType.INFO,
                    context: `Socket(protocol: ${protocol}, host: ${hostOption}, id: ${id}) stream is created`
                }
            );
        });

        streamEvent.on("stream-pipeline-error", (id, err) => {
            if (err) {
                log(
                    {
                        tag: this.tag,
                        type: LogType.ERROR,
                        context: `Stream(${id}) pipeline error, cause: ${err}`,
                    }
                );
            }
        });
    }

}