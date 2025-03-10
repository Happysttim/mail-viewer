import Database from "better-sqlite3-multiple-ciphers";
import { User } from "./schema";
import fs from "node:fs";
import { createHash } from "node:crypto";

function mkdir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function deleteUserDatabase(dbName: string): boolean {
    if (fs.existsSync(`./data/users/${dbName}.db`)) {
        fs.rmSync(`./data/users/${dbName}.db`);
        return true;
    }

    return false;
}

async function createUserDatabase(user: User) {
    mkdir("./data/users/");
    await withDatabase(`./data/users/${user.id}.db`, async database => {
        database.pragma(`key='${user.password}'`);
        database.pragma("foreign_key=1");
        database.exec(`
            CREATE TABLE IF NOT EXISTS AddressTable (
                streamId TEXT NOT NULL PRIMARY KEY,
                mailId TEXT NOT NULL,
                mailPassword TEXT NOT NULL,
                protocol TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL
            ) 
        `);
        database.exec(`
            CREATE TABLE IF NOT EXISTS MailTable (
                mailId INTEGER PRIMARY KEY AUTOINCREMENT,
                streamId TEXT NOT NULL,
                uid TEXT NOT NULL,
                isSeen NUMERIC NOT NULL,
                date NUMERIC NOT NULL,
                fromAddress TEXT NOT NULL,
                subject TEXT NOT NULL,
                CONSTRAINT streamId_fk FOREIGN KEY(streamId)
                REFERENCES AddressTable(streamId)
                ON DELETE CASCADE
            )
        `);
    });
}

export async function withDatabase<T = unknown>(path: string, fn: ((database: Database.Database) => Promise<void>) | ((database: Database.Database) => Promise<T>)): Promise<T | undefined> {
    const database = new Database(path);
    const fnResult = await fn(database);
    database.close();

    return fnResult ?? undefined;
}

export async function createUserTable() {
    mkdir("./data/");
    await withDatabase("./data/user.db", async database => {
        database.exec(`
            CREATE TABLE IF NOT EXISTS UserTable (
                id TEXT NOT NULL PRIMARY KEY,
                password TEXT NOT NULL
            )    
        `);
    });
}


export async function addUser(user: User) {
    await withDatabase("./data/user.db", async database => {
        database.prepare("INSERT INTO UserTable (id, password) VALUES (?, ?)").run(
            user.id, 
            createHash("sha256").update(user.password).digest().toString("hex")
        );
        await createUserDatabase(user);
    });
}

export async function deleteUser(id: string) {
    mkdir("./data/");
    await withDatabase("./data/user.db", async database => {
        database.prepare("DELETE FROM UserTable WHERE id = ?").run(id);
        deleteUserDatabase(id);
    });
}