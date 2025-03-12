import { MailNetwork } from "lib/stream/network";
import { CommandMap, HostOption } from "lib/type";
import { CommandTransform } from "lib/stream/transform";
import { Parser } from "lib/parser";
import { uid } from "uid";

type Pipe<T extends CommandMap> = {
    commandTransform: CommandTransform<T>;
    parser: Parser<T>;
}
type PipeMap<T extends CommandMap = CommandMap> = Map<new () => T, Pipe<T>>;
type NetworkMap<T extends CommandMap = CommandMap> = Map<string, MailNetwork<T>>;

export class StreamManager {

    private pipeMap: PipeMap<any> = new Map();
    private networkMap: NetworkMap<any> = new Map();

    register<T extends CommandMap>(commandMap: new () => T, pipe: Pipe<T>) {
        this.pipeMap.set(commandMap, pipe);
    }

    async createStream<T extends CommandMap>(commandMap: new () => T, hostOption: HostOption, id?: string): Promise<MailNetwork<T> | undefined> {
        const pipe = this.pipeMap.get(commandMap);
        if (!pipe) {
            return undefined;
        }
        const command = new commandMap();
        const streamId = id ?? await this.generateStreamID();

        const stream = new MailNetwork<T>(
            streamId,
            command,
            pipe.commandTransform,
            pipe.parser,
            hostOption,
        );

        this.networkMap.set(streamId, stream);
        return stream;
    }

    stream<T extends CommandMap>(id: string): MailNetwork<T> | undefined {
        return this.networkMap.get(id);
    }

    remove(id: string): boolean {
        this.networkMap.get(id)?.disconnect();
        return this.networkMap.delete(id);
    }

    async flush() {
        for(const [_, value] of Object.entries(this.networkMap)) {
            const handler = value.handler();
            if (handler) {
                await handler.flush();
            }
        };
    }

    private async generateStreamID(): Promise<string> {
        let generate: string = "";
        while(this.networkMap.get(generate = uid(16))){}
        return generate;
    }

}