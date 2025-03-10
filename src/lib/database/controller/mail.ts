import { Address, Mail, User } from "lib/database/schema";
import { withDatabase } from "lib/database";

export class MailController {

    readonly address: Address;
    readonly user: User;
    readonly path: string;

    constructor(path: string, user: User, address: Address) {
        this.path = path;
        this.user = user;
        this.address = address;
    }

    async newMail(mail: Mail): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO MailTable (
                    streamId,
                    uid,
                    isSeen,
                    date,
                    fromMail,
                    subject
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                this.address.streamId,
                mail.uid,
                mail.isSeen,
                mail.date,
                mail.fromAddress,
                mail.subject
            )
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async removeAll() {
        await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            database.exec("DELETE FROM MailTable");
        });
    }

    async remove(mailId: number): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("DELETE FROM MailTable WHERE mailId = ?").run(mailId);
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async all(): Promise<Mail[]> {
        const mails = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], Mail[]>(`
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
                    streamId = ?
            `).get(this.address.streamId);
        });
        
        return mails ? mails.map<Mail>(value => value) : [];
    }

    async range(mailIds: number[]): Promise<Mail[]> {
        const mails = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return mailIds.map<Mail | undefined>(mailId => {
                return database.prepare<unknown[], Mail>(`
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
                        mailId = ?
                `).get(mailId);
            }).filter<Mail>(mail => mail !== undefined);
        });
        
        return mails ? mails.map<Mail>(value => value) : [];
    }

    async page(page: number, limit: number): Promise<Mail[]> {
        const mails = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], Mail[]>(`
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
                    streamId = ?
                ORDER BY 
                    mailId DESC
                LIMIT
                    ?, ?
            `).get(
                this.address.streamId,
                (page - 1) * limit + 1,
                (page - 1) * limit + limit
            );
        });

        return mails ? mails.map<Mail>(value => value) : [];
    }

    async mail(mailId: number): Promise<Mail | undefined> {
        return await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], Mail>(`
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
                    mailId = ?
            `).get(mailId);
        });
    }

    async readAll(): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`UPDATE MailTable SET isSeen = TRUE FROM streamId = ? AND isSeen = FALSE`).run(this.address.streamId);
        });
        
        return result ? result.changes > 0 : false;
    }

    async readRange(mailIds: number[]): Promise<number> {
        const mails = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return mailIds.filter(mailId => {
                const result = database.prepare(`UPDATE MailTable SET isSeen = TRUE FROM mailId = ? AND isSeen = FALSE`).run(mailId);
                if (result) {
                    return result.changes > 0;
                }

                return false;
            }).length;
        });
        
        return mails ?? 0;
    }

    async read(mailId: number): Promise<number> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`UPDATE MailTable SET isSeen = TRUE FROM mailId = ?`).run(mailId);
        });

        return result ? result.changes : 0;
    }

}