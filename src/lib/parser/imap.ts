import ImapCommandMap from "lib/command/imap";
import Parser from "./parser";
import { TypeOf, UnknownKeysParam, z, ZodObject, ZodTypeAny } from "zod";
import { BodyStructureSchema, CapabilitySchema, ImapResult } from "lib/object/schema/imap";
import { CommandResult } from "lib/type";

const OK = (tag: string): string => `${tag} OK`;
const NO = (tag: string): string => `${tag} NO`;
const BAD = (tag: string): string => `${tag} BAD`;

const ATTRIBUTE = [
    "charset", "name", "boundary", "filename",
    "creation-date", "modificationd-date", "read-date",
    "size", "id", "inline", "attachment"
] as const;

type ResultType = "OK" | "NO" | "BAD" | "UNKNOWN" | "NO_EOF";
type BodyStructure = z.infer<typeof BodyStructureSchema>;

export default class ImapParser extends Parser<ImapCommandMap> {

    readonly tag: string;

    constructor(tag: string) {
        super();
        this.tag = tag;
    }

    eof(): boolean {
        const bufferUtf = this.buffer.toString("utf8");
        const expr = new RegExp(`^${this.tag} (OK|NO|BAD)`, "gm");

        return expr.test(bufferUtf);
    }

    schema(): TypeOf<typeof this.commandResult.schema> | undefined {
        if (!this.eof()) {
            return undefined;
        }

        const { command, args, schema } = this.commandResult;
        const bufferUtf8 = this.buffer.toString("utf8");
        const isError = ["NO", "BAD", "UNKNOWN"].includes(this.resultType());

        if (["store", "noop", "idle", "expunge", "login", "logout"].includes(command)) {
            return schema.parse({
                error: isError,
            });
        }

        if (command === "capability") {
            const match = bufferUtf8.matchAll(/^\W\sCAPABILITY\s(\w+)\s(.+)/gm);

            if (match) {
                const capability = [...match];

                return CapabilitySchema.parse({
                    error: false,
                    result: {
                        imapVersion: capability[0] ? capability[0][1] ?? "" : "",
                        supports: capability[0] ? (capability[0][2] ?? "").split(" ") : [],
                    }
                });
            }

            return CapabilitySchema.parse({
                error: true,
            });
        }

        if (command === "uid") {
            
        }

        return undefined;
    }

    flushAndChange(result: ImapResult): void {
        super.flushAndChange(result);
    }

    private resultType(): ResultType {
        if (!this.eof()) {
            return "NO_EOF";
        }
        const bufferUtf8 = this.buffer.toString("utf8");
        const expr = (type: (tag: string) => string): RegExp => {
            return new RegExp(`^${type(this.tag)}`, "gm");
        }

        return expr(OK).test(bufferUtf8) ? "OK" :
            expr(NO).test(bufferUtf8) ? "NO" :
            expr(BAD).test(bufferUtf8) ? "BAD" : "UNKNOWN"; 
    }

    private bodystructureParser(structMessage: string): BodyStructure[][] {
        const result: BodyStructure[][] = [];
        const structMatcher = [...structMessage.matchAll(/\(BODYSTRUCTURE\s(.+)\)/gm) ?? []];

        const stack: {
            contents: string,
            depth: number,
            parentBoundary: string,
        }[] = [];

        if (structMatcher.length === 0) {
            return result;
        }

        for (const matcher of structMatcher) {
            if (!matcher[1]) {
                return result;
            }

            const sturctures: BodyStructure[] = [];


            for (let i = 0; i < matcher[1].length; i++) {
                if (matcher[i].charAt(i) === "(") {
                    
                }
            }

            result.push(sturctures);
        }

        return result;
    }
    
}