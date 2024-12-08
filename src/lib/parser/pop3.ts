import Pop3CommandMap from "lib/command/pop3";
import { Pop3Result } from "lib/object/schema/pop3";
import { z } from "zod";
import Parser from "./parser";

type CommandType = "SINGLE" | "MULTI" | "RETR" | "UNKNOWN";

export default class Pop3Parser extends Parser<Pop3CommandMap> {

    private buffer: Buffer = Buffer.from([]);
    private octets: number = 0;
    private isError: boolean = false;
    private firstLine: string = "";

    eof(): boolean {
        if (this.isError) {
            return true;
        }

        const bufferUtf8 = this.buffer.toString("utf8");

        if (this.commandType() === "SINGLE") {
            return /^(\+OK)|(\-ERR)/g.test(this.firstLine.trim());
        }

        if (this.commandType() === "MULTI") {
            return bufferUtf8.endsWith(".\r\n");
        }

        if (this.commandType() === "UNKNOWN") {
            const contents = bufferUtf8.split("\r\n").slice(1, -1).join("\r\n");
            return this.octets <= contents.length && bufferUtf8.endsWith(".\r\n");
        }

        return false;
    }

    schema(): z.infer<typeof this.commandResult.schema> | undefined {
        if (!this.eof()) {
            return undefined;
        }

        const command = this.commandResult.command;
        const schema = this.commandResult.schema;
        const bufferUtf8 = this.buffer.toString("utf8");
        
        if (["user", "pass", "dele"].includes(command)) {
            return schema.parse({
                error: this.isError,
            });
        }

        if (command === "stat") {
            const numbers = bufferUtf8.match(/\d+/g);
            if (this.isError || numbers === null) {
                return schema.parse({
                    error: true,
                });
            }

            return schema.parse({
                error: false,
                result: {
                    amount: parseInt(numbers[0]),
                    octets: parseInt(numbers[1]),
                }
            });
        }

        if (command === "list") {
            const numbers = bufferUtf8.match(/\d+/g);
            const list: {
                index: number,
                octets: number,
            }[] = [];

            if (this.isError || numbers === null) {
                return schema.parse({
                    error: true,
                });
            }

            for(let i = 2; i < numbers.length; i += 2) {
                list.push(
                    {
                        index: parseInt(numbers[i]),
                        octets: parseInt(numbers[i + 1]),
                    }
                )
            }

            return schema.parse({
                error: false,
                result: {
                    amount: parseInt(numbers[0]),
                    octets: parseInt(numbers[1]),
                    list,
                }
            })
        }

        if (command === "retr") {
            
        }

        return undefined;
    }

    concatBuffer(buffer: Buffer) {
        this.buffer = Buffer.concat([this.buffer, buffer]);
        if (this.firstLine === "") {
            this.init();
        }
    }

    flushAndChange(pop3Result: Pop3Result) {
        this.buffer.fill(0);
        this.buffer = Buffer.from([]);
        this.firstLine = "";
        this.octets = 0;

        this.commandResult = pop3Result;

        this.init();
    }

    private commandType(): CommandType {
        const command = this.commandResult.command;
        const args = this.commandResult.args;

        if (["user", "pass", "quit", "stat", "dele"].includes(command)) {
            return "SINGLE";
        }

        if (["list", "uidl"].includes(command)) {
            return args.length > 0 ? "SINGLE" : "MULTI";
        }

        if (command === "retr") {
            return this.isError ? "SINGLE" : "RETR";
        }

        return "UNKNOWN";
    }

    private init() {
        const bufferUtf8 = this.buffer.toString("utf8");

        this.firstLine = bufferUtf8.substring(0, bufferUtf8.indexOf("\r\n"));
        this.isError = bufferUtf8.trim().startsWith("-ERR");

        this.pickOctets();
    }

    private pickOctets() {
        const command = this.commandResult.command;
        if (
            (
                command === "stat" || 
                command === "list" ||
                command === "retr"
            ) &&
            !this.isError
        ) {
            const onlyNumber = /\d(\b|\w+)/g;
            const numbers = onlyNumber.exec(this.firstLine);
            
            if (numbers) {
                this.octets = parseInt(numbers[1]) ?? parseInt(numbers[0]);
            }
        }
    }

}