import { ImapCommandMap } from "lib/command";
import { Handler } from "lib/stream/network";
import { safeResult } from "./safeResult";
import { decode } from "./decodeUtf7";

export const findImapMailbox = async (handler: Handler<ImapCommandMap>): Promise<string> => {
    const search = ["all", "allmail", "전체", "모든", "전체메일", "모든메일", "전체메일함", "모든메일함"];

    const listResult = await handler.command("list").execute("\"\"", "\"*\"");

    if (!safeResult(listResult)) {
        return "INBOX";
    }

    const boxes = listResult.schema.result.map((box) => decode(box.boxName));
    return boxes.find((v) => search.includes(v.toLowerCase().replaceAll(" ", ""))) || "INBOX";
};