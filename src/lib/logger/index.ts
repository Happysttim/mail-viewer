import LoggerQueue from "./queue";
import Console from "./console";
import { Message } from "./logger";

const consoleLogger = new LoggerQueue(new Console());

const log = (message: Message) => {
    consoleLogger.add_log(message);
};

export default log;