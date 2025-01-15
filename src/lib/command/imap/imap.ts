import { CapabilityResult, CapabilitySchema, createImapResult, ErrorSchema, ExpungeResult, FetchResult, FetchSchema, IdleResult, ListResult, ListSchema, LoginResult, LogoutResult, NoopResult, SearchResult, SearchSchema, SelectResult, SelectSchema, StandardFlag, StatusResult, StatusSchema, StoreResult, UidResult } from "lib/object/schema/imap";
import { CommandMap, Protocol } from "lib/type/";

export default class ImapCommandMap implements CommandMap {
    readonly __protocol: Protocol = "IMAP";

    capability(): CapabilityResult {
        return createImapResult("capability", [], CapabilitySchema);
    }

    store(action: string, flag: StandardFlag): StoreResult {
        return createImapResult("store", [action, flag], ErrorSchema);
    }

    uid(command: "fetch" | "store" | "search", range: string, criteria: string): UidResult {
        return createImapResult("uid", [command, range, criteria], SearchSchema);
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

    search(criteria: string): SearchResult {
        return createImapResult("search", [criteria], SearchSchema);
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

    fetch(range: string, items: string): FetchResult {
        return createImapResult("fetch", [range, items], FetchSchema);
    }

    logout(): LogoutResult {
        return createImapResult("logout", [], ErrorSchema);
    }
};