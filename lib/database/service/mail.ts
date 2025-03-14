import { StreamDTO, MailDTO, UserDTO } from "lib/database/dto";
import { withDatabase } from "lib/database";

export class MailService {

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

    async newMail(mail: MailDTO): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO MailTable (
                    streamId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                this.stream.streamId,
                mail.uid,
                mail.isSeen ? 1 : 0,
                mail.date,
                mail.fromAddress,
                mail.subject
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async removeAll() {
        await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            database.exec("DELETE FROM MailTable");
        });
    }

    async remove(mailId: number): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("DELETE FROM MailTable WHERE mailId=?").run(mailId);
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async all(): Promise<MailDTO[]> {
        const mails = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailDTO>(`
                SELECT
                    mailId,
                    streamId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                FROM
                    MailTable
                WHERE
                    streamId=?
            `).all(this.stream.streamId);
        });
        
        return mails ?? [];
    }

    async range(mailIds: number[]): Promise<MailDTO[]> {
        const mails = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return mailIds.map<MailDTO | undefined>((mailId) => {
                return database.prepare<unknown[], MailDTO>(`
                    SELECT
                        mailId,
                        streamId,
                        uid,
                        isSeen,
                        date,
                        fromAddress,
                        subject
                    FROM
                        MailTable
                    WHERE
                        mailId=?
                `).get(mailId);
            }).filter<MailDTO>((mail) => mail !== undefined);
        });
        
        return mails ?? [];
    }

    async page(page: number, limit: number): Promise<MailDTO[]> {
        const mails = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailDTO>(`
                SELECT
                    mailId,
                    streamId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                FROM
                    MailTable
                WHERE
                    streamId=?
                ORDER BY 
                    mailId DESC
                LIMIT
                    ?, ?
            `).all(
                this.stream.streamId,
                (page - 1) * limit + 1,
                (page - 1) * limit + limit
            );
        });

        return mails ?? [];
    }

    async mail(mailId: number): Promise<MailDTO | undefined> {
        return await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailDTO>(`
                SELECT
                    mailId,
                    streamId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                FROM
                    MailTable
                WHERE
                    mailId=?
            `).get(mailId);
        });
    }

    async readAll(): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("UPDATE MailTable SET isSeen=TRUE FROM streamId=? AND isSeen=FALSE").run(this.stream.streamId);
        });
        
        return result ? result.changes > 0 : false;
    }

    async readRange(mailIds: number[]): Promise<number> {
        const mails = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return mailIds.filter((mailId) => {
                const result = database.prepare("UPDATE MailTable SET isSeen=TRUE FROM mailId=? AND isSeen=FALSE").run(mailId);
                if (result) {
                    return result.changes > 0;
                }

                return false;
            }).length;
        });
        
        return mails ?? 0;
    }

    async read(mailId: number): Promise<number> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("UPDATE MailTable SET isSeen=TRUE FROM mailId=?").run(mailId);
        });

        return result ? result.changes : 0;
    }

}