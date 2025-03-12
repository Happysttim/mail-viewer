import { SearchQuery } from "./search";

export type Range = `${number}:${number}` | `${number}`;
export type FetchPeek = "FLAGS" | "INTERNALDATE" | "RFC822" | "RFC822.HEADER" | "BODYSTRUCTURE";
export type FlagOperation = "FLAGS" | "+FLAGS" | "-FLAGS" | "FLAGS.SILENT" | "+FLAGS.SILENT" | "-FLAGS.SILENT";
export type Flag = "\\Seen" | "\\Answered" | "\\Flagged" | "\\Deleted" | "\\Draft" | "\\Recent";
export type FetchArgument = {
    range: Range;
    peek: FetchPeek;
};
export type StoreArgument = {
    operation: FlagOperation;
    flag: Flag;
};
export type CopyArgument = {
    range: Range;
    mailBox: string;
};
export type UIDArgument = "FETCH" | "STORE" | "SEARCH" | "COPY" | "EXPUNGE" | "MOVE";
export type UIDType<Arg extends UIDArgument> = 
    Arg extends "FETCH" ? FetchArgument : 
    Arg extends "STORE" ? StoreArgument :
    Arg extends "SEARCH" ? SearchQuery :
    Arg extends "COPY" | "MOVE" ? CopyArgument :
    Arg extends "EXPUNGE" ? Range : never;

export const UIDArgumentValue = [
    "FETCH",
    "STORE",
    "SEARCH",
    "COPY",
    "EXPUNGE",
    "MOVE",
] as const;