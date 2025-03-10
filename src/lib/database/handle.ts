import { User } from "./schema";
import { withDatabase } from "./initialize";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { UserController } from "./controller/user";

export async function existsUser(id: string): Promise<boolean> {
    if (!fs.existsSync(`./data/users/${id}.db`)) {
        return false;
    }

    return await withDatabase("./data/user.db", async database => {
        return database.prepare<unknown[], User>("SELECT id FROM id = ?").get(id);
    }) !== undefined;
}

export async function user(user: User): Promise<UserController | undefined> {
    if (!existsUser(user.id)) {
        return undefined;
    }
    const result = await withDatabase(`./data/users/${user.id}.db`, async database => {
        database.pragma(`key='${user.password}'`);
        return database.prepare<unknown[], User>("SELECT id FROM id = ? AND password = ?").get(
            user.id,
            createHash("sha256").update(user.password).digest().toString("hex")
        );
    });

    return result ? new UserController(result, `./data/users/${user.id}.db`) : undefined;
}