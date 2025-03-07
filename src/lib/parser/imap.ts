import { ImapCommandMap, SearchQuery } from "lib/command/imap";
import Parser from "./parser";
import { TypeOf } from "zod";
import { CapabilitySchema, FetchResultSchema, FetchSchema, ImapResult, SearchSchema, SelectSchema, UIDErrorResultSchema } from "lib/object/schema/imap";
import { bodystructure } from "./common/structure";
import { FetchArgument, FetchPeek, UIDArgument } from "lib/command/imap/type";
import { contentSchema } from "./common/contents";
import { Zod } from "lib/type";
import { ErrorSchema } from "lib/object/schema/common";
import { ListSchema } from "lib/object/schema/pop3";

const OK = (tag: string): string => `${tag} OK`;
const NO = (tag: string): string => `${tag} NO`;
const BAD = (tag: string): string => `${tag} BAD`;

type ResultType = "OK" | "NO" | "BAD" | "UNKNOWN" | "NO_EOF";
type FetchRFC822 = "RFC822" | "RFC822.HEADER" | "NO_RFC";
type Header = {
    date: string,
    from: string,
    to: string,
    subject: string,
}

type FetchField<Type extends FetchRFC822> = {
    fetchType: Type,
    fetchID: number,
    fetchUID: number | undefined,
} & 
    (
        Type extends "RFC822" ? {
            fetchType: "RFC822",
            size: number,
            header: string,
            body: string,
        } :
        Type extends "RFC822.HEADER" ? {
            size: number,
            fetchType: "RFC822.HEADER",
            header: string,
        } : {
            fetchType: "NO_RFC",
            data: string,
        }
    );

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

    protected receiveSchema(): typeof this.commandResult.schema | undefined {
        if (!this.eof()) {
            return undefined;
        }

        const { command, args, schema } = this.commandResult;
        const bufferUtf8 = this.buffer.toString("utf8");
        const isError = ["NO", "BAD", "UNKNOWN"].includes(this.resultType());

        if (["store", "noop", "idle", "expunge", "login", "logout"].includes(command)) {
            return ErrorSchema.safeParse({
                error: isError,
            });
        }

        if (command === "capability") {
            const match = bufferUtf8.matchAll(/^\W\sCAPABILITY\s(\w+)\s(.+)/gm);

            if (match) {
                const capability = [...match];

                return CapabilitySchema.safeParse({
                    error: false,
                    result: {
                        imapVersion: capability[0] ? capability[0][1] ?? "" : "",
                        supports: capability[0] ? (capability[0][2] ?? "").split(" ") : [],
                    }
                });
            }

            return CapabilitySchema.safeParse({
                error: true,
            });
        }

        if (command === "search") {
            return SearchSchema.safeParse({
                error: isError,
                result: this.search(bufferUtf8),
            });
        }

        if (command === "select") {
            const existsRecent = [...bufferUtf8.matchAll(/\W\s(\d+)\s(EXISTS|RECENT)/gm)];
            const flags = [...bufferUtf8.matchAll(/\W\sFLAGS\s(?:[(])(.+)(?:[)])/gm)];
            const ok = [...bufferUtf8.matchAll(/\W\sOK\s(?:[\[])(UIDVALIDITY|UIDNEXT|PERMANENTFLAGS)\s(\d+|(?:[(])(.+)(?:[)]))(?:[\]])/gm)];

            if (existsRecent.length > 0 && flags.length > 0 && ok.length > 0) {
                const exists = existsRecent.find(v => v[2].toUpperCase() === "EXISTS");
                const recent = existsRecent.find(v => v[2].toUpperCase() === "RECENT");
                const validUID = ok.find(v => v[1].toUpperCase() === "UIDVALIDITY");
                const nextUID = ok.find(v => v[1].toUpperCase() === "UIDNEXT");
                const permanentFlags = ok.find(v => v[1].toUpperCase() === "PERMANENTFLAGS");

                return SelectSchema.safeParse({
                    error: false,
                    result: {
                        boxName: args[0],
                        flags: flags[0][1].split(" ") ?? [],
                        exists: exists ? parseInt(exists[1]) : 0,
                        recent: recent ? parseInt(recent[1]) : 0,
                        validUID: validUID ? parseInt(validUID[2]) : 0,
                        nextUID: nextUID ? parseInt(nextUID[2]) : 0,
                        parmanentFlags: permanentFlags ? permanentFlags[3].split(" ") : [],
                    }
                });
            } else {
                return SelectSchema.safeParse({
                    error: true
                });
            }
        }

        if (command === "list") {
            const list = [...bufferUtf8.matchAll(/^\W\sLIST\s\((\\HasNoChildren|\\HasChildren)(?: )?(.+)?\)\s(?:\")(.+?)(?:\")\s(?:")(.+?)(?:")/gm)];
            if (list.length > 0) {
                const result = list.map(v => {
                    return {
                        hasChildren: v[1] === "\\HasChildren",
                        flags: (v[2] ?? "").split(" "),
                        separate: v[3],
                        boxName: v[4],
                    }
                });

                return ListSchema.safeParse({
                    error: false,
                    result,
                });
            }

            return ListSchema.safeParse({
                error: true,
            });
        }

        if (command === "fetch") {
            const fetchSchema = this.fetch(bufferUtf8, args[1] as FetchPeek);
            if (fetchSchema) {
                return FetchSchema.safeParse({
                    error: false,
                    result: fetchSchema,
                })
            }
            return FetchSchema.safeParse({
                error: false,
            });
        }

        if (command === "uid") {
            const uidArg = args[0] as UIDArgument;
            if (["COPY", "MOVE", "STORE", "EXPUNGE"].includes(uidArg)) {
                return UIDErrorResultSchema.safeParse({
                    error: isError,
                    result: {
                        uidResult: {
                            arg: uidArg,
                        }
                    }
                });
            }

            if (uidArg === "FETCH") {
                const fetchArgs = args[1] as FetchArgument;
                const fetchSchema = this.fetch(bufferUtf8, fetchArgs.peek);

                if (fetchSchema) {
                    return UIDErrorResultSchema.safeParse({
                        error: false,
                        result: {
                            uidResult: {
                                arg: "FETCH",
                                fetch: fetchSchema,
                            }
                        }
                    });
                }

                return UIDErrorResultSchema.safeParse({
                    error: true,
                    result: {
                        uidResult: {
                            arg: "FETCH",
                        }
                    }
                });
            }

            if (uidArg === "SEARCH") {
                const searchSchema = this.search(bufferUtf8);
                if (searchSchema) {
                    return UIDErrorResultSchema.safeParse({
                        error: false,
                        result: {
                            uidResult: {
                                arg: "SEARCH",
                                searchResult: searchSchema,
                            }
                        }
                    });
                }
                return UIDErrorResultSchema.safeParse({
                    error: true,
                    result: {
                        uidResult: {
                            arg: "SEARCH",
                        }
                    }
                });
            }
        }

        return undefined;
    }

    search(bufferUtf8: string): TypeOf<typeof SearchSchema> | undefined {
        const { args } = this.commandResult;

        const search = [...bufferUtf8.matchAll(/^\W\sSEARCH\s([\d+\s]+(?:[\r\n]))/gm)];
        const query = args[1] as SearchQuery;

        if (search.length > 0) {
            const result = (search[0][1] ?? "").split(" ");

            return SearchSchema.parse({
                range: args[0],
                query: query.queryString,
                count: result.length,
                searchResult: result.map<Number>(v => parseInt(v)),
            });
        }

        return SearchSchema.parse({
            range: args[0],
            query: query.queryString,
            count: 0,
            searchResult: [],
        });
    }

    fetch(bufferUtf8: string, peek: FetchPeek): TypeOf<typeof FetchResultSchema> | undefined {
        const { args } = this.commandResult;
        const fields = (() => {
            const fields = [...
                bufferUtf8.matchAll(
                    ["FLAGS", "INTERNALDATE", "BODYSTRUCTURE"].includes(peek) ?
                    /^\W\s(\d+)\sFETCH\s\(.+?\s([\W\w\s]+?)(?:\)|\sUID\s(\d+)\))$/gm :
                    peek === "RFC822.HEADER" ?
                    /^\W\s(\d+)\sFETCH\s\(.+?\s(?:\{(\d+)\})(?:[\s\r\n]([\W\w\s]+?))(?:\r\n\r\n)(?:\sUID\s(\d+))?\)$/gm :
                    peek === "RFC822" ?
                    /^\W\s(\d+)\sFETCH\s\(.+?\s(?:\{(\d+)\})(?:[\s\r\n]([\W\w\s]+?))(?:\r\n\r\n)([\W\w\s]+?)(?:[\r\n]+\)|\sUID\s(\d+)\))$/gm :
                    /[]/g
                )
            ];

            if (fields.length === 0) {
                return [];
            }

            if (["FLAGS", "INTERNALDATE", "BODYSTRUCTURE"].includes(peek)) {
                return fields.map<FetchField<"NO_RFC">>(v => {
                    return {
                        fetchType: "NO_RFC",
                        fetchID: parseInt(v[1]),
                        data: v[2],
                        fetchUID: v[3] ? parseInt(v[3]) : undefined,
                    }
                });
            }

            if (peek === "RFC822.HEADER") {
                return fields.map<FetchField<"RFC822.HEADER">>(v => {
                    return {
                        fetchType: "RFC822.HEADER",
                        fetchID: parseInt(v[1]),
                        size: parseInt(v[2]),
                        header: v[3],
                        fetchUID: v[4] ? parseInt(v[4]) : undefined,
                    }
                });
            }

            if (peek === "RFC822") {
                return fields.map<FetchField<"RFC822">>(v => {
                    return {
                        fetchType: "RFC822",
                        fetchID: parseInt(v[1]),
                        size: parseInt(v[2]),
                        header: v[3],
                        body: v[4],
                        fetchUID: v[5] ? parseInt(v[5]) : undefined,
                    }
                });
            }

            return [];
        })();

        if (fields.length === 0) {
            return undefined;
        }

        if (peek === "BODYSTRUCTURE") {
            const fetchData = fields as FetchField<"NO_RFC">[];
            return FetchResultSchema.parse({
                fetchResult: {
                    fetchType: "BODYSTRUCTURE",
                    fetchStructure: fetchData.map(v => {
                        return {
                            fetchID: v.fetchID,
                            fetchUID: v.fetchUID,
                            structure: bodystructure(v.data),
                        }
                    }),
                }
            });
        }

        if (peek === "FLAGS") {
            const fetchData = fields as FetchField<"NO_RFC">[];
            return FetchResultSchema.parse({
                fetchResult: {
                    fetchType: "FLAGS",
                    fetchFlag: fetchData.map(v => {
                        return {
                            fetchID: v.fetchID,
                            fetchUID: v.fetchUID,
                            flagSchema: {
                                flags: v.data.split(" ") ?? [],
                            }
                        }
                    }),
                }
            });
        }

        if (peek === "INTERNALDATE") {
            const fetchData = fields as FetchField<"NO_RFC">[];
            return FetchResultSchema.parse({
                fetchResult: {
                    fetchType: "INTERNALDATE",
                    fetchDate: fetchData.map(v => {
                        return {
                            fetchID: v.fetchID,
                            fetchUID: v.fetchUID,
                            internalDate: v.data,
                        }
                    }),
                }
            });
        }

        if (peek === "RFC822") {
            const fetchData = fields as FetchField<"RFC822">[];
            return FetchResultSchema.parse({
                fetchResult: {
                    fetchType: "RFC822",
                    fetchContent: fetchData.map(v => {
                        const mailContent = {
                            ...this.header(v.header),
                            content: contentSchema(v.header + "\r\n\r\n" + v.body),
                        }
                        return {
                            id: v.fetchID,
                            mailContent: mailContent,
                        }
                    }),
                },
            });
        }

        if (peek === "RFC822.HEADER") {
            const fetchData = fields as FetchField<"RFC822.HEADER">[];
            return FetchResultSchema.parse({
                fetchResult: {
                    fetchType: "RFC822.HEADER",
                    fetchHeader: fetchData.map(v => {
                        return {
                            id: v.fetchID,
                            header: this.header(v.header),
                        }
                    }),
                },
            });
        }

        return undefined;
    }

    private header(headerString: string): Header {
        const headerMatches = headerString.matchAll(/^(?:(.+?):)\s*([\s\S]+?)(?=^.+:)/gm);
        const header: Header = {
            date: "",
            from: "",
            to: "",
            subject: "",
        };

        for (const match of headerMatches) {
            const key = match[1].replace(/[\r\n]/, "").trim().toLowerCase();
            switch (key) {
                case "date":
                    header.date = match[2].replaceAll(/[\r\n]/gm, "").trim();
                    break;
                case "from":
                    header.from = match[2].replaceAll(/[\r\n]/gm, "").trim();
                    break;
                case "to":
                    header.to = match[2].replaceAll(/[\r\n]/gm, "").trim();
                case "subject":
                    header.subject = match[2].replaceAll(/[\r\n]/gm, "").trim();
                    break;
                default:
            }
        }

        return header;
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
}