import { createPop3Result, DeleResult, DeleSchema, ErrorSchema, ListResult, ListSchema, PassResult, QuitResult, RetrResult, RetrSchema, StatResult, StatSchema, UserResult } from "lib/object/schema/pop3";
import { CommandMap,  Protocol } from "lib/type";

export default class Pop3CommandMap implements CommandMap {
    readonly __protocol: Protocol = "POP3";
    
    user(userid: string): UserResult {
        return createPop3Result("user", [userid], ErrorSchema);
    }

    pass(password: string): PassResult {
        return createPop3Result("pass", [password], ErrorSchema);
    }

    stat(): StatResult {
        return createPop3Result("stat", [], StatSchema);
    }

    list(id?: number | undefined): ListResult {
        return createPop3Result("list", id ? [id] : [], ListSchema);
    }

    retr(id: number): RetrResult {
        return createPop3Result("retr", [id], RetrSchema);
    }

    dele(id: number): DeleResult {
        return createPop3Result("dele", [id], DeleSchema);
    }

    quit(): QuitResult {
        return createPop3Result("quit", [], ErrorSchema);
    }
}