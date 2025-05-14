import { MailNetwork } from "lib/stream/network";
import { CommandMap, HostOption } from "lib/type";
import { CommandTransform } from "lib/stream/transform";
import { Parser } from "lib/parser";
import { uid } from "uid";

type Pipe<T extends CommandMap> = {
    commandTransform: CommandTransform<T>;
    parser: Parser<T>;
};
type NetworkMap<T extends CommandMap = CommandMap> = Map<string, MailNetwork<T>>;

export class StreamManager {

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private networkMap: NetworkMap<any> = new Map();

    /* eslint-enable @typescript-eslint/no-explicit-any */

    async createStream<T extends CommandMap>(commandMap: T, pipe: Pipe<T>, hostOption: HostOption, streamId: string): Promise<MailNetwork<T> | undefined> {
        const stream = new MailNetwork<T>(
            streamId,
            commandMap,
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
        for(const [, value] of Object.entries(this.networkMap)) {
            const handler = value.handler();
            if (handler) {
                await handler.flush();
            }
        }
    }

    async generateStreamID(): Promise<string> {
        let generate: string = "";
        do {
            generate = uid(16);
        } while(this.networkMap.get(generate = uid(16)));
        return generate;
    }

}