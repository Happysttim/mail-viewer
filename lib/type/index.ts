/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodObject, ZodTypeAny } from "zod";

export interface CommandMap {
    readonly __protocol: string;
}
export type Zod = ZodObject<{[key: string]: ZodTypeAny}>;
export type CommandResult<T extends CommandMap, C extends CommandName<T>, Z extends z.infer<Zod>> = {
    command: C;
    args: CommandArgs<T, C>;
    schema: Z;
};

export type CommandName<T extends CommandMap> = Extract<keyof Omit<T, "__protocol">, string>;
export type Result<Map extends CommandMap, Command extends CommandName<Map>> = 
    Map[Command] extends (...args: any[]) => infer S ? S : never;
export type IdResult<Map extends CommandMap> = {
    id: string,
    commandResult: CommandResult<Map, CommandName<Map>, z.infer<Zod>>
};
export type CommandArgs<T extends CommandMap, K extends CommandName<T>> = T[K] extends (...args: any[]) => any
    ? Parameters<T[K]> : never;

export type Tls = {
    rejectUnauthorized?: boolean | undefined
};

export type HostOption = {
    hostname: string;
    port: number;
    secure: boolean;
    tls?: Tls;
};