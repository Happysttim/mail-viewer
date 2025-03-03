import Pop3CommandMap from "lib/command/pop3";
import { CommandArgs, CommandName, CommandResult } from "lib/type";
import { z, ZodObject, ZodTypeAny } from "zod";
import { ContentSchema, ErrorSchema } from "./common";

export function createPop3Result<T extends CommandName<Pop3CommandMap>, Z extends ZodObject<{[key: string]: ZodTypeAny}>>
    (
        command: T,
        args: CommandArgs<Pop3CommandMap, T>,
        schema: Z
    ): CommandResult<Pop3CommandMap, T, Z> {
        return { command, args, schema };
    }

export const StatSchema = ErrorSchema.extend({
    result: z.object({
        amount: z.number(),
        octets: z.number(),
    }).optional(),
});

export const ListSchema = ErrorSchema.extend({
    result: z.object({
        amount: z.number(),
        octets: z.number(),
        list: z.array(z.object({
            index: z.number(),
            octets: z.number(),
        })).optional(),
    }),
});

export const RetrSchema = ErrorSchema.extend({
    result: z.object({
        date: z.string(),
        from: z.string(),
        to: z.string(),
        subject: z.string(),
        content: ContentSchema,
    }).optional(),
});

export const UidlSchema = ErrorSchema.extend({
    result: z.array(
        z.object({
            seq: z.number(),
            uid: z.string(),
        })
    ).optional(),
});

export type UserResult = CommandResult<Pop3CommandMap, "user", typeof ErrorSchema>;
export type PassResult = CommandResult<Pop3CommandMap, "pass", typeof ErrorSchema>;
export type StatResult = CommandResult<Pop3CommandMap, "stat", typeof StatSchema>;
export type ListResult = CommandResult<Pop3CommandMap, "list", typeof ListSchema>;
export type RetrResult = CommandResult<Pop3CommandMap, "retr", typeof RetrSchema>;
export type UidlResult = CommandResult<Pop3CommandMap, "uidl", typeof UidlSchema>;
export type DeleResult = CommandResult<Pop3CommandMap, "dele", typeof ErrorSchema>;
export type QuitResult = CommandResult<Pop3CommandMap, "quit", typeof ErrorSchema>;
export type Pop3Result = UserResult | PassResult | StatResult | ListResult | RetrResult | UidlResult | DeleResult | QuitResult;
export type Pop3Schema = typeof ErrorSchema | typeof StatSchema | typeof ListSchema | typeof UidlSchema | typeof RetrSchema;
 
