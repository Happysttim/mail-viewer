export type MailFilterKey = "FROM" | "SUBJECT" | "CONTENTS" | "START_DATE" | "END_DATE" | "SEEN";
export type MailFilterMap = Map<MailFilterKey, unknown[]>;
export type Mail = {
    subject: string,
    from: string,
    to: string,
    date: string,
    contents: string,
};
export type StreamIds = string[];