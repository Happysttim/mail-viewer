/* eslint-disable @typescript-eslint/no-explicit-any */
import { observe } from "app/config";
import { MailFilterMap } from "app/type";
import { contextBridge, ipcRenderer } from "electron";
import { MailDTO, ProfileDTO, StreamDTO, UserDTO } from "lib/database/dto";

type InvokeMap = {
    "create-user-account": (userDto: UserDTO) => Promise<boolean>;
    "request-profile": (streamId: string) => Promise<ProfileDTO | undefined>;
    "insert-mail-address": (streamDto: StreamDTO) => Promise<boolean>;
    "delete-user-account": (userDto: UserDTO) => Promise<boolean>;
    "delete-mail-address": (streamId: string) => Promise<boolean>;
    "update-mail-address": (streamDto: StreamDTO) => Promise<boolean>;
    "update-profile": (profileDto: ProfileDTO) => Promise<boolean>;
    "get-mail-list-page": (page: number, limit: number) => Promise<MailDTO[]>;
    "get-mail-list-filter": (filterMap: MailFilterMap) => Promise<MailDTO[]>;
};

type RequestMap = {
    "request-main-login": UserDTO;
    "request-profile": void;
    "request-mail-list": string;
    "request-mail": number;
};

type Keys<K> = keyof K;
type MapParameter<T, K extends Keys<T>> = T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never;
type ReturnType<T, K extends Keys<T>> = T[K] extends (...args: any[]) => infer S ? S : never;

contextBridge.exposeInMainWorld("ipcRenderer", {
    request: <K extends Keys<RequestMap>>(channel: K, ...args: [RequestMap[K]]): void => ipcRenderer.send(channel, args),
    invoke: <K extends Keys<InvokeMap>>(channel: K, ...args: MapParameter<InvokeMap, K>): Promise<ReturnType<InvokeMap, K>> => ipcRenderer.invoke(channel, args),
});

contextBridge.exposeInMainWorld("observe", {
    observe,
});