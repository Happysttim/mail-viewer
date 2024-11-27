import { Transform } from "node:stream";
import { TransformCallback } from "stream";
import Protocol from "../../type/protocol";
import { HostOption } from "src/lib/object/network/host-option";
import log from "src/lib/logger";
import { LogType } from "src/lib/logger/logger";

export default class MailTransform extends Transform {

    private readonly protocol: Protocol;
    private readonly tag = "MailTransform";
    readonly hostOption: HostOption;

    constructor(protocol: Protocol, hostOption: HostOption) {
        super();
        this.protocol = protocol;
        this.hostOption = hostOption;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `호스트 옵션: ${JSON.stringify(this.hostOption)}`
            }
        );
        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: chunk.toString("utf-8")
            }
        );

        callback(null, chunk);
    }

}