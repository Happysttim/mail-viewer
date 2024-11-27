import Protocol from "../type/protocol";
import { CommandMap } from "./command";

export default class Pop3CommandMap implements CommandMap {
    readonly __protocol: Protocol = "POP3";
    
    user(userid: string): string {
        return `USER ${userid}`;
    }

    pass(password: string): string {
        return `PASS ${password}`;
    }

    stat(): string {
        return "STAT";
    }

    list(id?: number | undefined): string {
        return `LIST ${id ?? ""}`;
    }

    retr(id: number): string {
        return `RETR ${id}`;
    }

    dele(id: number): string {
        return `DELE ${id}`;
    }

    quit(): string {
        return "QUIT";
    }
}