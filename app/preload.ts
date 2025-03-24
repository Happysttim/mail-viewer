/* eslint-disable @typescript-eslint/no-explicit-any */
import { MailFilterMap } from "app/type";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { MailDTO, ProfileDTO, StreamDTO, UserDTO } from "lib/database/dto";
import { getObserve } from "./config";

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
    "request-win-control": "CLOSE" | "MINIMUM" | "MAXIMUM" | "UNMAXIMUM";
};

type ReceiveMap = {
    "request-expand": (_: IpcRendererEvent, onExpand: boolean) => void;
};

type Keys<K> = keyof K;
type MapParameter<T, K extends Keys<T>> = T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never;
type ReturnType<T, K extends Keys<T>> = T[K] extends (...args: any[]) => infer S ? S : never;
type EventListener<T, K extends Keys<T>> = T[K] extends (event: IpcRendererEvent, ...args: any[]) => any ? T[K] : (event: IpcRendererEvent, ...args: any[]) => void;

contextBridge.exposeInMainWorld("ipcRenderer", {
    request: <K extends Keys<RequestMap>>(channel: K, ...args: [RequestMap[K]]): void => ipcRenderer.send(channel, args),
    invoke: <K extends Keys<InvokeMap>>(channel: K, ...args: MapParameter<InvokeMap, K>): Promise<ReturnType<InvokeMap, K>> => ipcRenderer.invoke(channel, args),
    on: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>): Electron.IpcRenderer => ipcRenderer.on(channel, listener),
});

export interface IpcRenderer {
    request: <K extends Keys<RequestMap>>(channel: K, ...args: [RequestMap[K]]) => void,
    invoke: <K extends Keys<InvokeMap>>(channel: K, ...args: MapParameter<InvokeMap, K>) => Promise<ReturnType<InvokeMap, K>>,
    on: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>) => Electron.IpcRenderer,
}

contextBridge.exposeInMainWorld("observe", getObserve());