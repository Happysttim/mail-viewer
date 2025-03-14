import { ProfileDTO, StreamDTO, UserDTO } from "lib/database/dto";
import { withDatabase } from "lib/database/initialize";
import { MailService } from "./mail";
import { ProfileService } from "./profile";

export class UserService {

    readonly user: UserDTO;
    readonly path: string; 

    constructor(user: UserDTO, path: string) {
        this.user = user;
        this.path = path;
    }

    async createStream(address: StreamDTO): Promise<boolean> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO StreamTable (
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                address.streamId,
                address.mailId,
                address.mailPassword,
                address.protocol,
                address.host,
                address.port
            );
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }
    
    async updateStream(stream: StreamDTO): Promise<boolean> {
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
                    port=?
                WHERE
                    streamId=?
            `).run(
                stream.mailId,
                stream.mailPassword,
                stream.protocol,
                stream.host,
                stream.port,
                stream.streamId,
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

    async profile(streamId: string): Promise<ProfileService | undefined> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], ProfileDTO>(`
                SELECT
                    streamId,
                    defaultName,
                    aliasName,
                    profileColor,
                    notificate
                FROM
                    ProfileTable
                WHERE
                    streamId=?    
            `).get(streamId);
        });

        return result ? new ProfileService(this.path, this.user, result) : undefined;
    }

    async stream(streamId: string): Promise<MailService | undefined> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port
                FROM
                    StreamTable
                WHERE
                    streamId=?    
            `).get(streamId);
        });

        return result ? new MailService(this.path, this.user, result) : undefined;
    }

    async streams(): Promise<MailService[]> {
        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], StreamDTO>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port
                FROM
                    StreamTable   
            `).all();
        });

        return result ? result.map<MailService>(
            (value) => new MailService(this.path, this.user, value)
        ) : [];
    }

}