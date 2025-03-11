import { ErrorSchema } from "lib/schema/common";
import { createPop3Result, DeleResult, ListResult, ListSchema, PassResult, QuitResult, RetrResult, RetrSchema, StatResult, StatSchema, UidlResult, UidlSchema, UserResult } from "lib/schema/pop3";
import { CommandMap } from "lib/type";

export class Pop3CommandMap implements CommandMap {
    readonly __protocol: string = "POP3";
    
    user(userid: string): UserResult {
        return createPop3Result("user", [userid], ErrorSchema);
    }

    pass(password: string): PassResult {
        return createPop3Result("pass", [password], ErrorSchema);
    }

    stat(): StatResult {
        return createPop3Result("stat", [], StatSchema);
    }

    list(id?: number): ListResult {
        return createPop3Result("list", id ? [id] : [], ListSchema);
    }

    retr(id: number): RetrResult {
        return createPop3Result("retr", [id], RetrSchema);
    }

    dele(id: number): DeleResult {
        return createPop3Result("dele", [id], ErrorSchema);
    }

    uidl(id?: number): UidlResult {
        return createPop3Result("uidl", id ? [id] : [], UidlSchema);
    }

    quit(): QuitResult {
        return createPop3Result("quit", [], ErrorSchema);
    }
}