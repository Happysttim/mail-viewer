import { StreamDTO, MailDTO, UserDTO, MailHistoryDTO } from "lib/database/dto";
import { withDatabase } from "lib/database";

type SearchOption = {
    pagenation?: {
        page: number;
        limit: number;
    },
    startDate?: string;
    endDate?: string;
    seen?: boolean;
    fromLike?: string;
    subjectLike?: string;
};

export class StreamService {

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

    async updateStream(stream: StreamDTO): Promise<boolean> {
        if (this.stream.streamId !== stream.streamId) {
            return false;
        }
        
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                UPDATE 
                    StreamTable 
                SET
                    mailId=?,
                    mailPassword=?,
                    protocol=?,
                    host=?,
                    port=?,
                    tls=?,
                    defaultName=?,
                    aliasName=?,
                    profileColor=?,
                    notificate=?,
                    isNew=?
                WHERE
                    streamId=?
            `).run(
                stream.mailId,
                stream.mailPassword,
                stream.protocol,
                stream.host,
                stream.port,
                stream.tls ? 1 : 0,
                stream.defaultName,
                stream.aliasName,
                stream.profileColor,
                stream.notificate ? 1 : 0,
                stream.isNew ? 1 : 0,
                stream.streamId,
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async newMail(fetchId: number, uid: string, isSeen: boolean, date: string, fromAddress: string, subject: string): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO MailTable (
                    streamId,
                    fetchId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                this.stream.streamId,
                fetchId,
                uid,
                isSeen ? 1 : 0,
                date,
                fromAddress,
                subject
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

    async remove(uid: string): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("DELETE FROM MailTable WHERE uid=?").run(uid);
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
                    fetchId,
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

    async searchMails(filter: SearchOption): Promise<MailDTO[]> {
        const [ syntax, values ] = this.selectMailSyntax(filter);
        const mails = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailDTO>(syntax).all(...values);
        });

        return mails ?? [];
    }

    async mail(uid: string): Promise<MailDTO | undefined> {
        return await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], MailDTO>(`
                SELECT
                    mailId,
                    streamId,
                    fetchId,
                    uid,
                    isSeen,
                    date,
                    fromAddress,
                    subject
                FROM
                    MailTable
                WHERE
                    streamId=? AND uid=?
            `).get(this.stream.streamId, uid);
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

    async read(uid: string): Promise<number> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare("UPDATE MailTable SET isSeen=TRUE WHERE uid=?").run(uid);
        });

        return result ? result.changes : 0;
    }

    private selectMailSyntax(searchOption: SearchOption): [string, [...unknown[]]] {
        const limit = searchOption.pagenation ? " LIMIT ? OFFSET ?" : "";
        const startDate = searchOption.startDate ? " AND date>=?" : "";
        const endDate = searchOption.startDate ? " AND date<=?" : "";
        const seen = searchOption.seen !== undefined ? " AND isSeen=?" : "";
        const from = searchOption.fromLike ? " AND fromAddress LIKE ?" : "";
        const subject = searchOption.subjectLike ? " AND subject LIKE ?" : "";
        
        const values: unknown[] = [];

        values.push(searchOption.startDate);
        values.push(searchOption.endDate);
        values.push(searchOption.subjectLike ? `%${searchOption.subjectLike}%` : undefined);
        values.push(searchOption.fromLike ? `%${searchOption.fromLike}%` : undefined);
        
        if (searchOption.seen !== undefined) {
            values.push(searchOption.seen ? 1 : 0);
        }

        if (searchOption.pagenation) {
            const pagenation = searchOption.pagenation;
            values.push(pagenation.limit, (pagenation.page - 1) * pagenation.limit);
        }

        return [`
            SELECT
                mailId,
                streamId,
                fetchId,
                uid,
                isSeen,
                date,
                fromAddress,
                subject
            FROM
                MailTable
            WHERE
                streamId=?
                ${startDate}
                ${endDate}
                ${subject}
                ${from}
                ${seen}
            ORDER BY
                mailId DESC
            ${limit}
        `,[
            this.stream.streamId,
            ...values.filter((v) => v !== undefined)
        ]];
    }
}