import User from "lib/object/user";
import { CommandMap, Protocol } from "lib/type/";

export default class ImapCommandMap implements CommandMap {
    readonly __protocol: Protocol = "IMAP";
    login(user: User): string {
        return `LOGIN ${user.id} ${user.password}`;
    }

    select(...args: string[]): string {
        return "SELECT";
    }

    list(...args: string[]): string {
        return "LIST";
    }

    status(...args: string[]): string {
        return "STATUS";
    }

    fetch(...args: string[]): string {
        return "FETCH";
    }

    logout(): string {
        return "LOGOUT";
    }
};