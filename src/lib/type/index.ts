import { TypeOf, z, ZodObject, ZodTypeAny } from "zod";

export type Zod = ZodObject<{[key: string]: ZodTypeAny}>;
export interface CommandMap {
    readonly __protocol: string;
}

export interface CommandResult<T extends CommandMap, C extends CommandName<T>, Z extends z.infer<Zod>> {
    command: C;
    args: CommandArgs<T, C>,
    schema: Z
}

export type CommandName<T extends CommandMap> = Extract<keyof Omit<T, "__protocol">, string>;
export type CommandArgs<T extends CommandMap, K extends CommandName<T>> = T[K] extends (...args: any[]) => any
    ? Parameters<T[K]> : never;