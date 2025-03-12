import { Pop3CommandMap } from "lib/command";
import { ListSchema, RetrSchema, StatSchema, UidlSchema } from "lib/schema/pop3";
import { z } from "zod";
import { Parser } from "./";
import { contentSchema } from "./common/contents";
import { ErrorSchema } from "lib/schema/common";
import { IdResult } from "lib/type";

type CommandType = "SINGLE" | "MULTI" | "RETR" | "UNKNOWN";

export class Pop3Parser extends Parser<Pop3CommandMap> {

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

        if (this.commandType() === "MULTI" || this.commandType() == "RETR") {
            return bufferUtf8.endsWith(".\r\n");
        }

        if (this.commandType() === "UNKNOWN") {
            const contents = bufferUtf8.split("\r\n").slice(1, -1).join("\r\n");
            return this.octets <= contents.length && bufferUtf8.endsWith(".\r\n");
        }

        return false;
    }

    protected receiveSchema(): z.SafeParseReturnType<typeof this.idResult.commandResult.schema, typeof this.idResult.commandResult.schema> | undefined {
        if (!this.eof()) {
            return undefined;
        }

        const { command, args } = this.idResult.commandResult;
        const bufferUtf8 = this.buffer.toString("utf8");
        
        if (["user", "pass", "dele"].includes(command)) {
            return ErrorSchema.safeParse({
                error: this.isError,
            });
        }

        if (command === "stat") {
            const numbers = bufferUtf8.match(/\d+/g);
            if (this.isError || numbers === null) {
                return StatSchema.safeParse({
                    error: true,
                });
            }

            return StatSchema.safeParse({
                error: false,
                result: {
                    amount: parseInt(numbers[0]),
                    octets: parseInt(numbers[1]),
                }
            });
        }

        if (command === "uidl") {
            const uidls = bufferUtf8.matchAll(/(\d+)\s(.+)\r?\n/gm);
            const uidlList: {
                seq: number,
                uid: string,
            }[] = [];

            if (this.isError || !uidls) {
                return UidlSchema.safeParse({
                    error: true
                });
            }

            for (const uidl of uidls) {
                uidlList.push({
                    seq: parseInt(uidl[1] ?? 0),
                    uid: uidl[2] ?? "",
                });
            }

            return UidlSchema.safeParse({
                error: false,
                result: uidlList
            });
        }

        if (command === "list") {
            const numbers = bufferUtf8.match(/\d+/g);
            const list: {
                index: number,
                octets: number,
            }[] = [];

            if (this.isError || !numbers) {
                return ListSchema.safeParse({
                    error: true,
                });
            }

            if (args.length === 0) {
                for(let i = 2; i < numbers.length; i += 2) {
                    list.push(
                        {
                            index: parseInt(numbers[i]),
                            octets: parseInt(numbers[i + 1]),
                        }
                    );
                }
    
                return ListSchema.safeParse({
                    error: false,
                    result: {
                        amount: parseInt(numbers[0]),
                        octets: parseInt(numbers[1]),
                        list,
                    }
                });
            }

            list.push(
                {
                    index: parseInt(numbers[0]),
                    octets: parseInt(numbers[1]),
                }
            );

            return ListSchema.safeParse({
                error: false,
                result: {
                    amount: 1,
                    octets: parseInt(numbers[1]),
                    list,
                }
            });
        }

        if (command === "retr") {
            const header = bufferUtf8.substring(0, bufferUtf8.indexOf("\r\n\r\n")).replaceAll("\t", "");
            const matches = header.matchAll(/^(?:(.+?):)\s*([\s\S]+?)(?=^.+:)/gm);
            const retrSchema: Partial<z.infer<typeof RetrSchema>> = {};
            const schema = contentSchema(bufferUtf8);

            retrSchema.result = {
                date: "",
                from: "",
                subject: "",
                to: "",
                content: schema,
            };

            for (const match of matches) {
                const key = match[1].replace("\n", "").trim().toLowerCase();
                switch (key) {
                    case "date":
                        retrSchema.result.date = match[2].replaceAll(/[\r\n]/gm, "").trim();
                        break;
                    case "from":
                        retrSchema.result.from = match[2].replaceAll(/[\r\n]/gm, "").trim();
                        break;
                    case "to":
                        retrSchema.result.to = match[2].replaceAll(/[\r\n]/gm, "").trim();
                        break;
                    case "subject":
                        retrSchema.result.subject = match[2].replaceAll(/[\r\n]/gm, "").trim();
                        break;
                    default:
                }
            }

            return RetrSchema.safeParse({
                error: false,
                ...retrSchema
            });
        }

        return undefined;
    }

    concatBuffer(buffer: Buffer) {
        super.concatBuffer(buffer);
        if (this.firstLine === "") {
            this.init();
        }
    }

    flushAndChange(pop3Result: IdResult<Pop3CommandMap>) {
        super.flushAndChange(pop3Result);
        this.firstLine = "";
        this.octets = 0;

        this.init();
    }

    private commandType(): CommandType {
        const command = this.idResult.commandResult.command;
        const args = this.idResult.commandResult.args;

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
        const command = this.idResult.commandResult.command;
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