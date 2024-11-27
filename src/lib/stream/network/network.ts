import { connect as tcp_connect, Socket } from "node:net";
import { connect as tls_connect, TLSSocket } from "node:tls";
import Protocol from "../../type/protocol";
import MailTransform from "./transform";
import log from "../../logger";
import { LogType } from "../../logger/logger";
import { pipeline, Transform } from "node:stream";
import { CommandMap } from "src/lib/command/command";
import Handler from "../command/handler";
import { HostOption } from "src/lib/object/network/host-option";

export enum Status {
    CONNECTING = "CONNECTING",
    ERROR = "ERROR",
    DISCONNECT = "DISCONNECT",
    CONNECTED = "CONNECTED"
}

export default class MailNetwork {

    private readonly protocol: Protocol;
    private readonly tag = "MailNetwork";
    readonly hostOption: HostOption;

    private socket: Socket | TLSSocket | undefined = undefined;
    private status: Status = Status.DISCONNECT;

    constructor(
        protocol: Protocol,
        hostOption: HostOption
    ) {
        this.protocol = protocol;
        this.hostOption = hostOption;
        this.status = Status.CONNECTING;
    }

    setPipe<T extends CommandMap>(handler: Handler<T>) {
        if (this.socket) {
            const transform = new MailTransform(this.protocol, this.hostOption);
            pipeline(handler, this.socket, transform, err => {
                if (err) {
                    log(
                        {
                            tag: this.tag,
                            type: LogType.ERROR,
                            context: `스트림 오류 발생: ${err}`,
                        }
                    );
                } else {
                    log(
                        {
                            tag: this.tag,
                            type: LogType.INFO,
                            context: `스트림 파이프라인 작동 중, 호스트 정보: ${JSON.stringify(this.hostOption)}`,
                        }
                    );
                }
            });
        } else {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `잘못된 파이프라인 구축입니다. (이유: 유효하지 않은 소켓입니다.)`,
                }
            );
        }
    }

    end() {
        if (this.socket) {
            this.socket.end(() => {
                log(
                    {
                        tag: this.tag,
                        type: LogType.INFO,
                        context: `소켓 통신이 종료되었습니다. 호스트 정보: ${JSON.stringify(this.hostOption)}`,
                    }
                );
            });
            this.socket = undefined;
        } else {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `잘못된 통신 종료 요청입니다. (이유: 유효하지 않은 소켓)`,
                }
            );
        }
    }

    statusLog() {
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: `현재 상태는 [${this.status}] 입니다. 호스트 정보: ${JSON.stringify(this.hostOption)}`,
            }
        );
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (this.hostOption.secure) {
                    this.socket = tls_connect(
                        {
                            host: this.hostOption.hostname,
                            port: this.hostOption.port,
                            rejectUnauthorized: this.hostOption.tls?.rejectUnauthorized ?? true,
                        }
                    )
                } else {
                    this.socket = tcp_connect(
                        {
                            host: this.hostOption.hostname,
                            port: this.hostOption.port,
                        }
                    )
                }
                
                log(
                    {
                        type: LogType.INFO,
                        tag: this.tag,
                        context: `메일서버 연결됨. 호스트 정보: ${JSON.stringify(this.hostOption)}`,
                    }
                );
                this.status = Status.CONNECTED;
                resolve();
            } catch(err) {
                this.socket = undefined;
                log(
                    {
                        type: LogType.ERROR,
                        tag: this.tag,
                        context: `메일서버와의 연결을 실패했습니다. 에러: ${err}`,
                    }
                );
                this.status = Status.ERROR;
                reject(err);
            }
        });
    }
}