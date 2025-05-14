/* eslint-disable @typescript-eslint/no-explicit-any */

export type MailFilterKey = "FROM" | "SUBJECT" | "CONTENTS" | "START_DATE" | "END_DATE" | "SEEN";
export type MailFilterMap = Map<MailFilterKey, unknown[]>;

export type StreamIds = string[];
export type Keys<K> = keyof K;
export type MapParameter<T, K extends Keys<T>> = T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never;
export type ReturnType<T, K extends Keys<T>> = T[K] extends (...args: any[]) => infer S ? S : never;