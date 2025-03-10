import { ImapCommandMap } from "lib/command";
import { CommandArgs, CommandName, CommandResult, Zod } from "lib/type";
import { z, ZodObject } from "zod";
import { ContentSchema, ErrorSchema } from "./common";
import { parse } from "date-fns";

export function createImapResult<T extends CommandName<ImapCommandMap>, Z extends ZodObject<any>>
    (
        command: T,
        args: CommandArgs<ImapCommandMap, T>,
        schema: Z
    ): CommandResult<ImapCommandMap, T, z.infer<Z>> {
        return { command, args, schema };
    }

export enum StandardFlag {
    Seen = "\\Seen",
    Answered = "\\Answered",
    Flagged = "\\Flagged",
    Deleted = "\\Deleted",
    Draft = "\\Draft",
    Recent = "\\Recent",
}

export const ListSchema = ErrorSchema.extend({
    result: z.array(
        z.object({
            hasChildren: z.boolean(),
            flags: z.array(z.string()),
            separate: z.string(),            
            boxName: z.string(),
        }),
    ).optional(),
});

export const SelectSchema = ErrorSchema.extend({
    result: z.object({
        boxName: z.string(),
        exists: z.number(),
        recent: z.number(),
        flags: z.array(z.string()),
        parmanentFlags: z.array(z.string()),
        validUID: z.number(),
        nextUID: z.number(),
    }).optional(),
});

export const HeaderSchema = z.object({
    date: z.string(),
    from: z.string(),
    to: z.string(),
    subject: z.string(),
});

export const FlagSchema = z.object({
    flags: z.array(z.string())
});

export const OctetSchema = z.object({
    octets: z.number(),
});

type BodyStructureType = {
    mimeType: string,
    subType: string,
    parameters?: { 
        key: string, 
        value: string,
    }[],
    contentId?: string,
    contentDescription?: string,
    transferEncoding?: string,
    contentLength?: number,
    contentLine?: number,
    md5Hash?: string,
    contentDisposition?: {
        type: string,
        parameters?: {
            key: string,
            value: string | number,
        }[],
    },
    language?: string | string[],
    location?: string,
    children?: BodyStructureType[],
}

export const BodyStructureSchema: z.ZodType<BodyStructureType> = z.object({
    mimeType: z.string(),
    subType: z.string(),
    parameters: z.array(z.object({
        key: z.string(),
        value: z.string(),
    })).optional(),
    contentId: z.string().optional(),
    contentDescription: z.string().optional(),
    transferEncoding: z.string().optional(),
    contentLength: z.number().optional(),
    contentLine: z.number().optional(),
    md5Hash: z.string().optional(),
    contentDisposition: z.object({
        type: z.string(),
        parameters: z.array(
            z.object({
                key: z.string(),
                value: z.union([z.string(), z.number()]),
            })
        ).optional()
    }).optional(),
    language: z.union([
        z.string(),
        z.array(z.string()),
    ]).optional(),
    location: z.string().optional(),
    children: z.array(z.lazy(() => BodyStructureSchema)).optional(),
});

export const InternalDateSchema = z.object({
    fetchID: z.number(),
    fetchUID: z.number().optional(),
    internalDate: z.string().transform(
        date => parse(date, "dd-MMM-yyyy HH:mm:ss X", new Date())
    ),
});

export const CapabilitySchema = ErrorSchema.extend({
    result: z.object({
        imapVersion: z.string(),
        supports: z.array(z.string()),
    }).optional(),
});

export const FetchFlagSchema = z.object({
    fetchType: z.literal("FLAGS"),
    fetchFlag: z.array(
        z.object({
            fetchID: z.number(),
            fetchUID: z.number().optional(),
            flagSchema: FlagSchema,
        })
    )
});

export const FetchInternaldateSchema = z.object({
    fetchType: z.literal("INTERNALDATE"),
    fetchDate: z.array(InternalDateSchema)
});

export const FetchBodyStructureSchema = z.object({
    fetchType: z.literal("BODYSTRUCTURE"),
    fetchStructure: z.array(
        z.object({
            fetchID: z.number(),
            fetchUID: z.number().optional(),
            structure: BodyStructureSchema.optional(),
        })
    )
});

export const FetchRFC822Schema = z.object({
    fetchType: z.literal("RFC822"),
    fetchContent: z.array(
        z.object({
            id: z.number(),
            mailContent: z.object({
                date: z.string(),
                from: z.string(),
                to: z.string(),
                subject: z.string(),
                content: ContentSchema,
            }),
        })
    )
});

export const FetchHeaderSchema = z.object({
    fetchType: z.literal("RFC822.HEADER"),
    fetchHeader: z.array(
        z.object({
            id: z.number(),
            header: HeaderSchema,
        })
    )
});

export const FetchResultSchema = z.object({
    fetchResult: z.discriminatedUnion("fetchType", [
        FetchFlagSchema,
        FetchInternaldateSchema,
        FetchBodyStructureSchema,
        FetchRFC822Schema,
        FetchHeaderSchema,
    ]),
});

export const FetchSchema = ErrorSchema.extend({
    result: FetchResultSchema.optional(),
});

export const UIDFetchSchema = z.object({
    arg: z.literal("FETCH"),
    fetch: FetchResultSchema.optional(),
});

export const UIDErrorSchema = z.object({
    arg: z.enum(
        [
            "STORE",
            "COPY",
            "MOVE",
            "EXPUNGE",
        ]
    ),
});

export const SearchSchema = z.object({
    range: z.string().regex(/^\d+($|\:\d+$)/),
    query: z.string().optional(),
    count: z.number(),
    searchResult: z.array(z.number())
});

export const UIDSearchSchema = z.object({
    arg: z.literal("SEARCH"),
    searchResult: SearchSchema.optional(),
});

export const UIDResultSchema = z.object({
    uidResult: z.discriminatedUnion("arg", [
        UIDFetchSchema,
        UIDErrorSchema,
        UIDSearchSchema
    ])
});

export const UIDErrorResultSchema = ErrorSchema.extend({
    result: UIDResultSchema.optional()
});

export const SearchErrorSchema = ErrorSchema.extend({
    result: SearchSchema.optional()
});

export const StatusSchema = ErrorSchema.extend({
    result: z.object({
        flags: z.array(z.enum(["MESSAGES", "RECENT", "UIDNEXT", "UIDVALIDITY", "UNSEEN", "HIGHESTMODSEQ"])),
        status: z.array(
            z.object({
                flag: z.string(),
                count: z.number(),
            })
        )
    }).optional(),
});

export type CapabilityResult = CommandResult<ImapCommandMap, "capability", z.infer<typeof CapabilitySchema>>;
export type StoreResult = CommandResult<ImapCommandMap, "store", z.infer<typeof ErrorSchema>>;
export type UidResult = CommandResult<ImapCommandMap, "uid", z.infer<typeof UIDErrorResultSchema>>;
export type NoopResult = CommandResult<ImapCommandMap, "noop", z.infer<typeof ErrorSchema>>;
export type IdleResult = CommandResult<ImapCommandMap, "idle", z.infer<typeof ErrorSchema>>;
export type ExpungeResult = CommandResult<ImapCommandMap, "expunge", z.infer<typeof ErrorSchema>>;
export type SearchResult = CommandResult<ImapCommandMap, "search", z.infer<typeof SearchErrorSchema>>;
export type LoginResult = CommandResult<ImapCommandMap, "login", z.infer<typeof ErrorSchema>>;
export type SelectResult = CommandResult<ImapCommandMap, "select", z.infer<typeof SelectSchema>>;
export type ListResult = CommandResult<ImapCommandMap, "list", z.infer<typeof ListSchema>>;
export type StatusResult = CommandResult<ImapCommandMap, "status", z.infer<typeof StatusSchema>>;
export type FetchResult = CommandResult<ImapCommandMap, "fetch", z.infer<typeof FetchSchema>>;
export type LogoutResult = CommandResult<ImapCommandMap, "logout", z.infer<typeof ErrorSchema>>;

export type ImapResult = CapabilityResult | StoreResult | UidResult | NoopResult | IdleResult |
    ExpungeResult | SearchResult | SelectResult | ListResult | StatusResult |
    FetchResult | LoginResult;
// export type ImapSchema = typeof CapabilitySchema | typeof ErrorSchema | typeof SearchSchema | typeof SelectSchema | typeof ListSchema | typeof FetchSchema;