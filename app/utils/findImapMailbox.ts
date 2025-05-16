import { ImapCommandMap } from "lib/command";
import { Handler } from "lib/stream/network";
import { safeResult } from "./safeResult";
import { imap } from "safe-utf7";

export const findImapMailbox = async (handler: Handler<ImapCommandMap>): Promise<string> => {
    const search = ["all", "allmail", "전체", "모든", "전체메일", "모든메일", "전체메일함", "모든메일함"];

    const listResult = await handler.command("list").execute("", "*");

    if (!safeResult(listResult)) {
        return "INBOX";
    }

    const boxes = listResult.schema.result.map((box) => imap.decode(box.boxName));
    return boxes.find((v) => search.indexOf(v.toLowerCase().replaceAll(" ", ""))) || "INBOX";
};