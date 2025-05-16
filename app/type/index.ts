/* eslint-disable @typescript-eslint/no-explicit-any */

export type MailFilter = {
    startDate?: string;
    endDate?: string;
    seen?: boolean;
    fromLike?: string;
    subjectLike?: string;
};

export type File = {
    filename: string;
    contentId?: string;
};

export type Mime = {
    part: string;
    contentTransferEncoding?: string;
    contentType: string;
    contentBody: string | Buffer<ArrayBuffer>;
    file?: File;
};

export type StreamIds = string[];
export type Keys<K> = keyof K;
export type MapParameter<T, K extends Keys<T>> = T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never;
export type ReturnType<T, K extends Keys<T>> = T[K] extends (...args: any[]) => infer S ? S : never;