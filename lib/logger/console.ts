import Logger, { LogType } from "./logger";

export default class Console implements Logger {
    log(type: LogType, message: string): void {
        console[type](message);
    }
}