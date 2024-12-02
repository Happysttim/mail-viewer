import MailNetwork from "lib/stream/network";
import { MailAddress, MailRegistry, CommandName, CommandArgs } from "lib/type";
import log from "lib/logger";
import { LogType } from "lib/logger/logger";
import { Protocol, ProtocolToMap } from "lib/type";

export default class StreamManager<P extends Protocol> {

    private mailRegistry: MailRegistry<ProtocolToMap<P>> = {}; 
    private readonly tag = "StreamManager";

    async registerNetwork(
        mailAddress: MailAddress,
        network: MailNetwork<ProtocolToMap<P>>
    ) {
        if (this.isRegisterMail(mailAddress)) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `${mailAddress} 는 이미 등록된 계정입니다.`
                }
            );

            throw new Error();
        }

        this.mailRegistry[mailAddress] = network;

        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `${mailAddress} 계정이 등록되었습니다.`
            }
        );
    }

    unregisterNetwork(mailAddress: MailAddress) {
        if (!this.isRegisterMail(mailAddress)) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `${mailAddress} 는 유효하지 않는 계정입니다.`
                }
            );

            throw new Error();
        }

        this.mailRegistry[mailAddress].end();
        delete this.mailRegistry[mailAddress];

        log(
            {
                tag: this.tag,
                type: LogType.INFO,
                context: `${mailAddress} 계정을 삭제했습니다.`
            }
        );
    }

    handle<
        Command extends CommandName<ProtocolToMap<P>>, 
        Args extends CommandArgs<ProtocolToMap<P>, Command>>
    (mailAddress: MailAddress, command: Command, ...args: Args): boolean {
        if (!this.isRegisterMail(mailAddress)) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `${mailAddress} 는 유효하지 않는 계정입니다.`
                }
            );

            return false;
        }

        const handle = this.mailRegistry[mailAddress].handler();
        if (!handle) {
            log(
                {
                    tag: this.tag,
                    type: LogType.ERROR,
                    context: `${mailAddress} 계정은 유효하지 않은 핸들러를 가지고있습니다.`
                }
            );

            return false;
        }

        handle.command(command, ...args);
        return true;
    }

    async flushAllHandler() {
        for(const [_, value] of Object.entries(this.mailRegistry)) {
            const handler = value.handler();
            if (handler) {
                await handler.flush();
            }
        };
    }

    dumpLog() {
        log(
            {
                tag: this.tag,
                type: LogType.DEBUG,
                context: "-----------------------------------DUMP LOG"
            }
        );

        Object.entries(this.mailRegistry).forEach(value => {
            log(
                {
                    tag: this.tag,
                    type: LogType.DEBUG,
                    context: `메일계정: ${value[0]}`
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

    private isRegisterMail(mailAddress: MailAddress): boolean {
        return this.mailRegistry[mailAddress] ? true : false;
    }

}