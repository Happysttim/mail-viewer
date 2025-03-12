import { LogMessage, LogType, Message } from "./logger";
import Logger from "./logger";

export default class LoggerQueue {

    private logQueue: LogMessage[] = [];
    private loggerPromise: Promise<void> = Promise.resolve();
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    add_log(message: Message) {
        this.logQueue.push({
            type: message.type ?? LogType.LOG,
            tag: message.tag ?? "DefaultLog",
            timestamp: Date.now(),
            context: message.context ?? "",
        });
        this.loggerPromise = this.loggerPromise.then(() => this.startLogProcessing());
    }

    private async startLogProcessing() {
        const message = this.logQueue.shift();
        if (message === undefined) {
            return;
        }
        const timestamp = new Date(message.timestamp);
        this.logger.log(message.type, `[${message.type.toUpperCase()}][${timestamp.toISOString()}][${message.tag}] ${message.context}`);
    }

}