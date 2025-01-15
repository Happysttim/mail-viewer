export type SearchOption = {
    hasBracket: boolean;
}

interface SearchArgument {
    criteria: "ALL" | "ANSWERED" | "DELETED" | "FLAGGED" | "SEEN" | "UNSEEN" | "DRAFT" | "RECENT" | "BEFORE" | "SINCE" | "ON" | "FROM" | "TO" | "TEXT" | "BODY" | "KEYWORD" | "HEADER";
    argument?: string;
}

type Operation = "AND" | "OR" | "NOT" | "BRACKET";
type FetchArgument = "BODY" | "BODY.PEEK" | "FLAGS" | "INTERNALDATE" | "RFC822" | "RFC822.HEADER" | "RFC822.SIZE" | "RFC822.TEXT" | "UID" | `BODY[TEXT]` | `BODY[${number}]`;
type StoreArgument = {
    operation: "FLAGS" | "+FLAGS" | "-FLAGS" | "FLAGS.SILENT" | "+FLAGS.SILENT" | "-FLAGS.SILENT";
    flag: "\\Seen" | "\\Answered" | "\\Flagged" | "\\Deleted" | "\\Draft" | "\\Recent";
}
type UIDArgument = "FETCH" | "STORE" | "SEARCH";
type UIDCriteria<Arg extends UIDArgument> = 
    Arg extends "FETCH" ? FetchArgument : 
    Arg extends "STORE" ? StoreArgument :
    Arg extends "SEARCH" ? SearchArgument[] : never;

class SearchOperation {
    private readonly conditions: SearchCondition[] = [];
}

export function createSearch(): SearchCondition {
    return new SearchCondition();
}

class SearchCondition {
    private readonly arguments: SearchArgument[] = [];

    constructor() {}

    all(): SearchCondition {
        this.arguments.push({ criteria: "ALL" });
        return this;
    }

    answered(): SearchCondition {
        this.arguments.push({ criteria: "ANSWERED" });
        return this;
    }

    deleted(): SearchCondition {
        this.arguments.push({ criteria: "DELETED" });
        return this;
    }

    flagged(): SearchCondition {
        this.arguments.push({ criteria: "FLAGGED" });
        return this;
    }

    seen(): SearchCondition {
        this.arguments.push({ criteria: "SEEN" });
        return this;
    }

    unseen(): SearchCondition {
        this.arguments.push({ criteria: "UNSEEN" });
        return this;
    }

    draft(): SearchCondition {
        this.arguments.push({ criteria: "DRAFT" });
        return this;
    }

    recent(): SearchCondition {
        this.arguments.push({ criteria: "RECENT" });
        return this;
    }

    before(date: string): SearchCondition {
        this.arguments.push({ criteria: "BEFORE", argument: date });
        return this;
    }

    since(date: string): SearchCondition {
        this.arguments.push({ criteria: "SINCE", argument: date });
        return this;
    }

    on(date: string): SearchCondition {
        this.arguments.push({ criteria: "ON", argument: date });
        return this;
    }

    from(address: string): SearchCondition {
        this.arguments.push({ criteria: "FROM", argument: address });
        return this;
    }

    to(address: string): SearchCondition {
        this.arguments.push({ criteria: "TO", argument: address });
        return this;
    }

    text(text: string): SearchCondition {
        this.arguments.push({ criteria: "TEXT", argument: text });
        return this;
    }

    body(text: string): SearchCondition {
        this.arguments.push({ criteria: "BODY", argument: text });
        return this;
    }

    keyword(keyword: string): SearchCondition {
        this.arguments.push({ criteria: "KEYWORD", argument: keyword });
        return this;
    }

    header(field: string): SearchCondition {
        this.arguments.push({ criteria: "HEADER", argument: field });
        return this;
    }
}