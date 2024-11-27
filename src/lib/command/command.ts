import Protocol from "../type/protocol";

export interface CommandMap {
    readonly __protocol: Protocol;
}

export type CommandName<T extends CommandMap> = keyof Omit<T, "__protocol">;
export type CommandArgs<T extends CommandMap, K extends CommandName<T>> = T[K] extends (...args: any[]) => any
    ? Parameters<T[K]> : never;