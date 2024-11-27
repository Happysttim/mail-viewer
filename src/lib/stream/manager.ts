import { CommandMap } from "../command/command";
import log from "../logger";
import { LogType } from "../logger/logger";
import Handler from "./command/handler";
import MailNetwork from "./network/network";

type MailAddress = Record<string, MailNetwork>

export default class StreamManager {

    private mailAddresses: MailAddress = {}; 
    private readonly tag = "StreamManager";

    connectPipe<T extends CommandMap>(mailAddress: string, handler: Handler<T>, network: MailNetwork): boolean {
        if (this.isRegisterMail(mailAddress)) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `메일 아이디(${mailAddress})는 이미 등록되어 있습니다.`
                }
            );
            return false;
        }
        network.setPipe(handler);
        this.mailAddresses[mailAddress] = network;
        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `메일 아이디(${mailAddress}) 파이프 연결`
            }
        );
        return true;
    }

    disconnectPipe(mailAddress: string): boolean {
        if (!this.isRegisterMail(mailAddress)) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `메일 아이디(${mailAddress})는 등록되어 있지 않습니다.`
                }
            );
            return false;
        }

        this.mailAddresses[mailAddress].end();
        return true;
    }

    dumpPipe() {
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------PIPE DUMP`,
            }
        );
        Object.entries(this.mailAddresses).forEach(mailAddress => {
            log(
                {
                    tag: this.tag,
                    type: LogType.DEBUG,
                    context: `메일계정 ${mailAddress[0]}, 호스트 정보 ${JSON.stringify(mailAddress[1].hostOption)}`,
                }
            );
        });
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: `--------------------------------------------END`,
            }
        );
    }

    network(mailAddress: string): MailNetwork | undefined {
        if (this.isRegisterMail(mailAddress)) {
            return this.mailAddresses[mailAddress];
        }
        return undefined;
    }

    private isRegisterMail(mailAddress: string): boolean {
        return this.mailAddresses[mailAddress] ? true : false;
    }

}