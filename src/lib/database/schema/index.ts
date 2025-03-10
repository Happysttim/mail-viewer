export type User = {
    id: string;
    password: string;
}

export type Address = {
    streamId: string;
    mailId: string;
    mailPassword: string;
    protocol: string;
    host: string;
    port: number;
}

export type Mail = {
    mailId: number,
    streamId: string;
    uid: string;
    isSeen: boolean;
    date: string;
    fromAddress: string;
    subject: string;
}