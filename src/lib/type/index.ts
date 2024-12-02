import Pop3CommandMap from "lib/command/pop3";
import MailNetwork from "lib/stream/network";
import ImapCommandMap from "lib/command/imap";

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

export type CommandName<T extends CommandMap> = keyof Omit<T, "__protocol">;
export type CommandArgs<T extends CommandMap, K extends CommandName<T>> = T[K] extends (...args: any[]) => any
    ? Parameters<T[K]> : never;
export type ProtocolToMap<P extends Protocol> = P extends "IMAP" 
    ? ImapCommandMap :
        (P extends "POP3"
            ? Pop3CommandMap : never
        );