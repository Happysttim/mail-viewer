import { ProfileDTO, UserDTO } from "../dto";
import { withDatabase } from "../initialize";

export class ProfileService {

    readonly user: UserDTO;
    readonly path: string;

    private profileDto: ProfileDTO;

    get profile(): ProfileDTO {
        return this.profileDto;
    }

    constructor(path: string, user: UserDTO, profileDto: ProfileDTO) {
        this.path = path;
        this.user = user;
        this.profileDto = profileDto;
    }

    async updateProfile(profileDto: ProfileDTO): Promise<boolean> {
        if (this.profileDto.streamId !== profileDto.streamId) {
            return false;
        }

        const result = await withDatabase(this.path, async (database) => {
            database.pragma(`key='${this.user.password}'`);
            return database.prepare(`
                UPDATE 
                    ProfileTable
                SET
                    defaultName=?,
                    aliasName=?,
                    profileColor=?,
                    notificate=?
                WHERE
                    streamId=?
            `).run(
                this.profileDto.streamId,
                profileDto.defaultName,
                profileDto.aliasName,
                profileDto.profileColor,
                profileDto.notificate ? 1 : 0,
            );
        });

        if (result) {
            this.profileDto = profileDto;
            return result.changes > 0;
        }

        return false;
    }

}