export enum LogType {
    WARN = "warn",
    ERROR = "error",
    INFO = "info",
    LOG = "log",
    DEBUG = "debug"
}
export interface LogMessage {
    type: LogType;
    timestamp: number;
    tag: string;
    context: string;
}
export type Message = Partial<Omit<LogMessage, "timestamp">>;

export default interface Logger {
    log(type: LogType, message: string): void;
}