import { Address, User } from "lib/database/schema";
import { withDatabase } from "lib/database/initialize";
import { MailController } from "./mail";

export class UserController {

    readonly user: User;
    readonly path: string; 

    constructor(user: User, path: string) {
        this.user = user;
        this.path = path;
    }

    async createAddress(address: Address): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                INSERT INTO AddressTable (
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
    
    async updateAddress(address: Address): Promise<boolean> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                UPDATE 
                    AddressTable 
                SET
                    mailId = ?,
                    mailPassword = ?,
                    protocol = ?,
                    host = ?,
                    port = ?
                WHERE
                    streamId = ?
            `).run(
                address.mailId,
                address.mailPassword,
                address.protocol,
                address.host,
                address.port,
                address.streamId
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
            const result = database.prepare("DELETE FROM AddressTable FROM streamId = ?").run(streamId);
            return result.changes > 0;
        }) ?? false;
    }

    async address(streamId: string): Promise<MailController | undefined> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], Address>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port
                FROM
                    AddressTable
                WHERE
                    streamId = ?    
            `).get(streamId);
        });

        return result ? new MailController(this.path, this.user, result) : undefined;
    }

    async addresses(): Promise<MailController[]> {
        const result = await withDatabase(this.path, async database => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare<unknown[], Address[]>(`
                SELECT
                    streamId,
                    mailId,
                    mailPassword,
                    protocol,
                    host,
                    port
                FROM
                    AddressTable   
            `).get();
        });

        return result ? result.map<MailController>(
            value => new MailController(this.path, this.user, value)
        ) : [];
    }

}