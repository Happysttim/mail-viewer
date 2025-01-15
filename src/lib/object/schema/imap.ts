import ImapCommandMap from "lib/command/imap";
import { CommandArgs, CommandName, CommandResult } from "lib/type";
import { z, ZodObject, ZodTypeAny } from "zod";
import { ContentSchema } from "./common";

export function createImapResult<T extends CommandName<ImapCommandMap>, Z extends ZodObject<{[key: string]: ZodTypeAny}>>
    (
        command: T,
        args: CommandArgs<ImapCommandMap, T>,
        schema: Z
    ): CommandResult<ImapCommandMap, T, Z> {
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

export const ErrorSchema = z.object({
    error: z.boolean(),
});

export const ListSchema = ErrorSchema.extend({
    result: z.array(
        z.object({
            alias: z.string(),
            path: z.string(),
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
        validUid: z.number(),
        nextUid: z.number(),
    }).optional(),
});

export const HeaderSchema = z.object({
    date: z.date(),
    from: z.string(),
    to: z.string(),
    subject: z.string(),
});

export const FlagSchema = z.object({
    flags: z.array(z.string())
});

export const UidSchema = z.object({
    uid: z.number(),
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

export const CapabilitySchema = ErrorSchema.extend({
    result: z.object({
        imapVersion: z.string(),
        supports: z.array(z.string()),
    }).optional(),
});

export const FetchSchema = ErrorSchema.extend({
    result: z.object({
        isFlag: z.boolean(),
        isUid: z.boolean(),
        isHeader: z.boolean(),
        isText: z.boolean(),
        isBodyStructure: z.boolean(),
        fetch: z.array(
            z.object({
                flag: FlagSchema.optional(),
                uid: UidSchema.optional(),
                bodyStructure: BodyStructureSchema.optional(),
                header: HeaderSchema.optional(),
                bodySchema: ContentSchema.optional(),
            }),
        ),
    }).optional(),
});

export const SearchSchema = ErrorSchema.extend({
    result: z.object({
        isUid: z.boolean(),
        isFlag: z.boolean(),
        isCondition: z.boolean(),
        range: z.string(),
        count: z.number(),
        condition: z.string().optional(),
        flags: z.array(FlagSchema).optional(),
        search: z.array(z.number()),
    }).optional(),
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

export type CapabilityResult = CommandResult<ImapCommandMap, "capability", typeof CapabilitySchema>;
export type StoreResult = CommandResult<ImapCommandMap, "store", typeof ErrorSchema>;
export type UidResult = CommandResult<ImapCommandMap, "uid", typeof SearchSchema>;
export type NoopResult = CommandResult<ImapCommandMap, "noop", typeof ErrorSchema>;
export type IdleResult = CommandResult<ImapCommandMap, "idle", typeof ErrorSchema>;
export type ExpungeResult = CommandResult<ImapCommandMap, "expunge", typeof ErrorSchema>;
export type SearchResult = CommandResult<ImapCommandMap, "search", typeof SearchSchema>;
export type LoginResult = CommandResult<ImapCommandMap, "login", typeof ErrorSchema>;
export type SelectResult = CommandResult<ImapCommandMap, "select", typeof SelectSchema>;
export type ListResult = CommandResult<ImapCommandMap, "list", typeof ListSchema>;
export type StatusResult = CommandResult<ImapCommandMap, "status", typeof StatusSchema>;
export type FetchResult = CommandResult<ImapCommandMap, "fetch", typeof FetchSchema>;
export type LogoutResult = CommandResult<ImapCommandMap, "logout", typeof ErrorSchema>;
export type ImapResult = CapabilityResult | StoreResult | UidResult | NoopResult | IdleResult |
    ExpungeResult | SearchResult | SelectResult | ListResult | StatusResult |
    FetchResult | LoginResult;
export type ImapSchema = typeof CapabilitySchema | typeof ErrorSchema | typeof SearchSchema | typeof SelectSchema | typeof ListSchema | typeof FetchSchema;