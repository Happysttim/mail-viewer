import { StreamDTO, UserDTO } from "lib/database/dto";
import { withDatabase } from "lib/database/initialize";
import { StreamService } from "./stream";
import { MailHistoryService } from "./mail-history";

export class UserService {

    readonly user: UserDTO;
    readonly path: string; 

    constructor(user: UserDTO, path: string) {
        this.user = user;
        this.path = path;
    }

    async createStream(stream: StreamDTO): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO StreamTable (
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port,
                    tls,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate,
                    isNew
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                stream.streamId,
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
                0,
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async deleteStream(streamId: string): Promise<boolean> {
        return await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            const result = database.prepare("DELETE FROM StreamTable FROM streamId=?").run(streamId);
            return result.changes > 0;
        }) ?? false;
    }

    async streamService(streamId: string): Promise<StreamService | undefined> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port,
                    tls,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate,
                    isNew
                FROM
                    StreamTable
                WHERE
                    streamId=?    
            `).get(streamId);
        });

        return result ? new StreamService(this.path, this.user, result) : undefined;
    }

    async mailHistoryService(streamId: string): Promise<MailHistoryService | undefined> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port,
                    tls,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate
                FROM
                    StreamTable
                WHERE
                    streamId=?    
            `).get(streamId);
        });

        return result ? new MailHistoryService(this.path, this.user, result) : undefined;
    }

    async stream(streamId: string): Promise<StreamDTO | undefined> {
        return await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port,
                    tls,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate
                FROM
                    StreamTable
                WHERE
                    streamId=?    
            `).get(streamId);
        });
    }

    async streams(): Promise<StreamDTO[]> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port,
                    tls,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate
                FROM
                    StreamTable   
            `).all();
        });

        return result ?? [];
    }

}