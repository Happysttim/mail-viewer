import log from "../logger";
import { LogType } from "../logger/logger";
import Handler from "../stream/command/handler";
import { CommandArgs, CommandName, CommandMap } from "./command";

export type QueueMessage<T extends CommandMap> = {
    [P in CommandName<T>]: {
        command: P;
        args: CommandArgs<T, P>;
    }
}[CommandName<T>];

export type CommandCallback<T extends CommandMap> = ((message: QueueMessage<T>) => Promise<void>);

export default class CommandQueue<T extends CommandMap> {

    private commandQueue: QueueMessage<T>[] = [];
    private promiseCommand: Promise<void> = Promise.resolve();
    
    private readonly tag = "CommandQueue";
    private readonly commandHandler: Handler<T>;

    constructor(commandHandler: Handler<T>) {
        this.commandHandler = commandHandler;
    }

    async flush() {
        await this.promiseCommand;
    }

    addQueue<Name extends CommandName<T>>(command: Name, ...args: CommandArgs<T, Name>) {
        const message: QueueMessage<T> = {
            command,
            args
        };
        this.commandQueue.push(message);
        this.promiseCommand = this.promiseCommand.then(async () => {
            this.startProcessCommand().then(() => {
                log(
                    {
                        tag: this.tag,
                        type: LogType.DEBUG,
                        context: `${command.toString()} 명령어 작성 성공, 매개 변수: ${JSON.stringify(args)}`
                    }
                );
            }).catch(err => {
                log(
                    {
                        tag: this.tag,
                        type: LogType.DEBUG,
                        context: `${command.toString()} 명령어 작성 실패, 매개 변수: ${JSON.stringify(args)}, 오류내용: ${err}`
                    }
                );
            });
        });
    }

    private async startProcessCommand(): Promise<void> {
        const message = this.commandQueue.shift();

        if (message === undefined) {
            log(
                {
                    type: LogType.ERROR,
                    tag: this.tag,
                    context: "커멘드 큐의 요소가 없습니다.",
                }
            );
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                if (this.commandHandler.write(message)) {
                    resolve();
                } else {
                    reject("CommandQueue Stream 작성 실패");
                }
            } catch(err) {
                reject(err);
            }
        });
    }

}