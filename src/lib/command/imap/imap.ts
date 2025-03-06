import { CapabilityResult, CapabilitySchema, createImapResult, ExpungeResult, FetchResult, FetchSchema, IdleResult, ListResult, ListSchema, LoginResult, LogoutResult, NoopResult, SearchErrorSchema, SearchResult, SelectResult, SelectSchema, StandardFlag, StatusResult, StatusSchema, StoreResult, UIDErrorResultSchema, UidResult } from "lib/object/schema/imap";
import { CommandMap } from "lib/type/";
import { SearchQuery } from "./search";
import { FetchPeek, Range, UIDArgument, UIDType } from "./type";
import { ErrorSchema } from "lib/object/schema/common";

export class ImapCommandMap implements CommandMap {
    readonly __protocol: string = "IMAP";

    capability(): CapabilityResult {
        return createImapResult("capability", [], CapabilitySchema);
    }

    store(action: string, flag: StandardFlag): StoreResult {
        return createImapResult("store", [action, flag], ErrorSchema);
    }

    uid<Arg extends UIDArgument>(arg: Arg, type: UIDType<Arg>): UidResult {
        return createImapResult("uid", [ arg, type ], UIDErrorResultSchema);
    }

    noop(): NoopResult {
        return createImapResult("noop", [], ErrorSchema);
    }

    idle(): IdleResult {
        return createImapResult("idle", [], ErrorSchema);
    }

    expunge(): ExpungeResult {
        return createImapResult("expunge", [], ErrorSchema);
    }

    search(range: Range, query: SearchQuery): SearchResult {
        return createImapResult("search", [ range, query ], SearchErrorSchema);
    }

    login(id: string, password: string): LoginResult {
        return createImapResult("login", [id, password], ErrorSchema);
    }

    select(box: string): SelectResult {
        return createImapResult("select", [box], SelectSchema);
    }

    list(reference: string, pattern: string): ListResult {
        return createImapResult("list", [reference, pattern], ListSchema);
    }

    status(box: string, attribute: string): StatusResult {
        return createImapResult("status", [box, attribute], StatusSchema);
    }

    fetch(range: string, items: FetchPeek): FetchResult {
        return createImapResult("fetch", [range, items], FetchSchema);
    }

    logout(): LogoutResult {
        return createImapResult("logout", [], ErrorSchema);
    }
};