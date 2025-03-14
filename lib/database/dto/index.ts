export type UserDTO = {
    id: string;
    password: string;
};

export type StreamDTO = {
    streamId: string;
    mailId: string;
    mailPassword: string;
    protocol: string;
    host: string;
    port: number;
};

export type ProfileDTO = {
    streamId: string;
    defaultName: string;
    aliasName: string;
    profileColor: string;
    notificate: boolean;
};

export type MailDTO = {
    mailId: number,
    streamId: string;
    uid: string;
    isSeen: boolean;
    date: string;
    fromAddress: string;
    subject: string;
};