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
    tls: boolean;
    defaultName: string;
    aliasName: string;
    profileColor: string;
    notificate: boolean;
    isNew: boolean;
};
export type MailHistoryDTO = {
    streamId: string;
    fetchId: number;
    uid: string;
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