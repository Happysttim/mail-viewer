import { connect as tcp_connect, Socket } from "node:net";
import { connect as tls_connect, TLSSocket } from "node:tls";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { pipeline } from "node:stream";
import CommandTransform from "./transform";
import { HostOption } from "lib/object/network/host-option";
import Receiver from "./receiver";
import { CommandMap } from "lib/type";
import CommandMemory from "./memory";
import Handler from "./handler";

export enum SocketStatus {
    CONNECTING = "CONNECTING",
    ERROR = "ERROR",
    DISCONNECT = "DISCONNECT",
    CONNECTED = "CONNECTED"
}

export default class MailNetwork<T extends CommandMap> {

    private readonly tag = "MailNetwork";
    private socket: Socket | TLSSocket | undefined = undefined;
    private commandHandler: Handler<T> | undefined = undefined; 
    private socketStatus: SocketStatus;

    readonly commandTransform: CommandTransform<T>;
    readonly hostOption: HostOption;

    constructor(
        commandTransform: CommandTransform<T>,
        hostOption: HostOption
    ) {
        this.hostOption = hostOption;
        this.commandTransform = commandTransform;
        this.socketStatus = SocketStatus.CONNECTING;
    }

    pipe() {
        if (this.socket) {
            const commandMemory = new CommandMemory<T>();
            this.commandHandler = new Handler(commandMemory);
            const receiver = new Receiver(commandMemory);

            pipeline(commandMemory, this.commandTransform, this.socket, receiver, err => {
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

    handler(): Handler<T> | undefined {
        return this.commandHandler;
    }

    end() {
        if (this.socket && this.socketStatus == SocketStatus.CONNECTED) {
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
            this.socketStatus = SocketStatus.DISCONNECT;
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

    status(): SocketStatus {
        return this.socketStatus;
    }

    printStatus() {
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: `현재 상태는 [${this.socketStatus}] 입니다. 호스트 정보: ${JSON.stringify(this.hostOption)}`,
            }
        );
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = this.hostOption.secure ? tls_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                        rejectUnauthorized: this.hostOption.tls?.rejectUnauthorized ?? true,
                    }
                ) :  tcp_connect(
                    {
                        host: this.hostOption.hostname,
                        port: this.hostOption.port,
                    }
                )

                this.socket.once("connect", () => {
                    log(
                        {
                            type: LogType.INFO,
                            tag: this.tag,
                            context: `메일서버 연결됨. 호스트 정보: ${JSON.stringify(this.hostOption)}`,
                        }
                    );
                    this.socketStatus = SocketStatus.CONNECTED;
                    resolve();
                });
            } catch(err) {
                this.socket = undefined;
                log(
                    {
                        type: LogType.ERROR,
                        tag: this.tag,
                        context: `메일서버와의 연결을 실패했습니다. 에러: ${err}`,
                    }
                );
                this.socketStatus = SocketStatus.ERROR;
                reject(err);
            }
        });
    }
}