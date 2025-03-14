import { UserDTO } from "./dto";
import { withDatabase } from "./initialize";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { UserService } from "./service/user";

export async function existsUser(id: string): Promise<boolean> {
    if (!fs.existsSync(`./data/users/${id}.db`)) {
        return false;
    }

    return await withDatabase("./data/user.db", async (database) => {
        return database.prepare<unknown[], UserDTO>("SELECT id FROM UserTable WHERE id=?").get(id);
    }) !== undefined;
}

export async function user(user: UserDTO): Promise<UserService | undefined> {
    if (!await existsUser(user.id)) {
        return undefined;
    }
    const result = await withDatabase("./data/user.db", async (database) => {
        return database.prepare<unknown[], UserDTO>("SELECT id FROM UserTable WHERE id=? AND password=?").get(
            user.id,
            createHash("sha256").update(user.password).digest().toString("hex")
        );
    });

    return result ? new UserService(user, `./data/users/${user.id}.db`) : undefined;
}