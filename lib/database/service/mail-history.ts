import { StreamDTO, UserDTO, MailHistoryDTO } from "lib/database/dto";
import { withDatabase } from "lib/database";

export class MailHistoryService {

    readonly user: UserDTO;
    readonly path: string;

    private streamDto: StreamDTO;

    get stream(): StreamDTO {
        return this.streamDto;
    }

    constructor(path: string, user: UserDTO, streamDto: StreamDTO) {
        this.path = path;
        this.user = user;
        this.streamDto = streamDto;
    }

    async mailHistories(orderBy: "fetchId" | "uid"): Promise<MailHistoryDTO[]> {
        const mail = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailHistoryDTO>(`
                SELECT
                    streamId,
                    fetchId,
                    uid
                FROM
                    MailHistoryTable
                WHERE
                    streamId=?
                ORDER BY
                    ${orderBy} ASC
            `).all(this.stream.streamId);
        });

        return mail ?? [];
    }

    async latestMailHistory(orderBy: "fetchId" | "uid"): Promise<MailHistoryDTO | undefined> {
        const mail = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailHistoryDTO>(`
                SELECT
                    streamId,
                    fetchId,
                    uid
                FROM
                    MailHistoryTable
                WHERE
                    streamId=?
                ORDER BY
                    ${orderBy} DESC
                LIMIT 1
            `).get(this.stream.streamId);
        });

        return mail;
    }

    async firstMailHistory(orderBy: "fetchId" | "uid"): Promise<MailHistoryDTO | undefined> {
        const mail = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailHistoryDTO>(`
                SELECT
                    streamId,
                    fetchId,
                    uid
                FROM
                    MailHistoryTable
                WHERE
                    streamId=?
                ORDER BY
                    ${orderBy} ASC
                LIMIT 1
            `).get(this.stream.streamId);
        });

        return mail;
    }

    async updateMailHistory(fetchId: number, uid: string): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                UPDATE 
                    MailHistoryTable 
                SET
                    fetchId=?
                WHERE
                    streamId=? AND uid=?
            `).run(
                fetchId,
                this.stream.streamId,
                uid,
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async insertMailHistory(fetchId: number, uid: string): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO MailHistoryTable (
                    streamId,
                    fetchId,
                    uid
                ) VALUES (?, ?, ?)
            `).run(
                this.stream.streamId,
                fetchId,
                uid
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async deleteOneMailHistory(fetchId: number, uid: string): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                DELETE FROM MailHistoryTable WHERE streamId=? AND uid=? AND fetchId=?
            `).run(
                this.stream.streamId,
                uid,
                fetchId,
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async deleteAllMailHistory(): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                DELETE FROM MailHistoryTable WHERE streamId=?
            `).run(
                this.stream.streamId
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async deleteMoreMailHistory(type: "FETCH" | "UID", criteria: number): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                DELETE FROM MailHistoryTable WHERE streamId=? AND ${
                    type === "FETCH" ? "fetchId>?" : "uid>?"
                }
            `).run(
                this.stream.streamId,
                criteria
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }
}