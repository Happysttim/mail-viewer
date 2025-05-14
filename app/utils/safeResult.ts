import { FetchPeek } from "lib/command/imap";
import { ImapResult, SearchResult, UidResult } from "lib/schema/imap";
import { Pop3Result } from "lib/schema/pop3";
import { Zod } from "lib/type";
import { z } from "zod";

export const safeUIDFetchResult = <T extends FetchPeek>(
    result: UidResult, 
    fetchPeek: T,
): result is UidResult & {
    schema: {
        error: false,
        result: {
            uidResult: {
                arg: "FETCH",
                fetch: {
                    fetchResult: {
                        fetchType: T,
                    }
                }
            }
        }
    }
} => {
    return !(
        !result.schema.result ||
        result.schema.error ||
        result.schema.result.uidResult.arg !== "FETCH" ||
        !result.schema.result.uidResult.fetch?.fetchResult ||
        result.schema.result.uidResult.fetch.fetchResult.fetchType != fetchPeek
    );
};

export const safeUIDSearchResult = (
    result: UidResult
): result is UidResult & {
    schema: {
        error: false,
        result: {
            uidResult: {
                arg: "SEARCH",
                searchResult: SearchResult,
            }
        }
    }
} => {
    return !(
        !result.schema.result ||
        result.schema.error ||
        result.schema.result.uidResult.arg !== "SEARCH" ||
        !result.schema.result.uidResult.searchResult
    );
};

export const safeResult = <Result extends ImapResult | Pop3Result>(
    result: Result
): result is Result & {
    schema: {
        error: false,
        result: z.infer<Zod>,
    }    
} => {
    return !(result.schema.error && !result.schema.result);
};