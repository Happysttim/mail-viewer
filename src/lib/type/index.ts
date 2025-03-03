import Pop3CommandMap from "lib/command/pop3";
import MailNetwork from "lib/stream/network";
import { ImapCommandMap } from "lib/command/imap";
import { ZodObject, ZodTypeAny } from "zod";
import { Pop3Schema } from "lib/object/schema/pop3";
import { ImapSchema } from "lib/object/schema/imap";

export type Zod = ZodObject<{[key: string]: ZodTypeAny}>;
export type Protocol = "IMAP" | "POP3";
export interface MailProtocol<T extends CommandMap> {
    protocol: Protocol;
    network: MailNetwork<T>;
}

export type MailAddress = `${string}@${string}.${string}`;
export type MailRegistry<T extends CommandMap> = Record<MailAddress, MailNetwork<T>>;

export interface CommandMap {
    readonly __protocol: Protocol;
}

export interface CommandResult<T extends CommandMap, C extends CommandName<T>, Z extends Zod> {
    command: C;
    args: CommandArgs<T, C>, 
    schema: Z
}

export type CommandName<T extends CommandMap> = keyof Omit<T, "__protocol">;
export type CommandArgs<T extends CommandMap, K extends CommandName<T>> = T[K] extends (...args: any[]) => any
    ? Parameters<T[K]> : never;
export type ProtocolToMap<P extends Protocol> = P extends "IMAP" 
    ? ImapCommandMap :
        (P extends "POP3"
            ? Pop3CommandMap : never
        );

export type CommandMapToSchema<T extends CommandMap> = T extends Pop3CommandMap 
? Pop3Schema : (
    T extends ImapCommandMap 
        ? ImapSchema : never
)