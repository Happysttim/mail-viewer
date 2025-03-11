import { StreamDTO, UserDTO } from "lib/database/dto";
import { withDatabase } from "lib/database/initialize";
import { MailService } from "./mail";

export class UserService {

    readonly user: UserDTO;
    readonly path: string; 

    constructor(user: UserDTO, path: string) {
        this.user = user;
        this.path = path;
    }

    async createStream(address: StreamDTO): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
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
            )
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }
    
    async updateAddress(stream: StreamDTO): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
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
                stream.streamId
            )
        });

        if (result) {
            return result.changes > 0;
        }

        return false;
    }

    async deleteAddress(streamId: string): Promise<boolean> {
        return await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            const result = database.prepare("DELETE FROM StreamTable FROM streamId=?").run(streamId);
            return result.changes > 0;
        }) ?? false;
    }

    async address(streamId: string): Promise<MailService | undefined> {
        const result = await withDatabase(this.path, async database => {
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

    async addresses(): Promise<MailService[]> {
        const result = await withDatabase(this.path, async database => {
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
            value => new MailService(this.path, this.user, value)
        ) : [];
    }

}