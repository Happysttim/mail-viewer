/* eslint-disable @typescript-eslint/no-explicit-any */

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { MailDTO, StreamDTO, UserDTO } from "lib/database/dto";
import { Keys, MailFilterMap, MapParameter, ReturnType } from "./type";

export type StreamExtend = {
    stream: StreamDTO;
    isError: boolean;
};

export type InvokeMap = {
    "create-user-account": (userDto: UserDTO) => boolean;
    "login-user-account": (userDto: UserDTO) => boolean;
    "get-all-streams": () => StreamExtend[];
    "reload-stream": (streamDto: StreamDTO) => StreamDTO;
    "insert-mail-address": (mailId: string, mailPassword: string, protocol: string, host: string, port: number, tls: boolean, defaultName: string, aliasName: string, profileColor: string, notificate: boolean) => StreamDTO | undefined;
    "delete-user-account": (userDto: UserDTO) => boolean;
    "delete-mail-address": (streamId: string) => boolean;
    "update-mail-address": (streamDto: StreamDTO) => boolean;
    "get-all-mails": (streamId: string) => MailDTO[];
    "get-mail-list-page": (streamId: string, page: number, limit: number) => MailDTO[];
    "get-mail-list-filter": (streamId: string, page: number, limit: number, filterMap?: MailFilterMap) => MailDTO[];
    "read-mail": (streamId: string, mailId: number) => boolean;
    "read-all-mail": (streamId: string) => boolean;
    "read-range-mail": (streamId: string, range: number[]) => boolean;
};

export type RequestMap = {
    "request-main-login": UserDTO;
    "request-logout": undefined;
    "request-stream": StreamDTO | undefined;
    "request-mail-list": string;
    "request-mail": number;
    "request-close-info": undefined;
    "request-win-control": "CLOSE" | "MINIMUM" | "MAXIMUM" | "UNMAXIMUM";
};

export type ReceiveMap = {
    "request-expand": (_: IpcRendererEvent, onExpand: boolean) => void;
    "request-stream": (_: IpcRendererEvent, streamDto: StreamDTO) => void;
    "on-fetch-notificate": (_: IpcRendererEvent, streamId: string) => void;
    "update-stream": (_: IpcRendererEvent, extend: StreamExtend) => void;
    "get-unseen-mails": (_: IpcRendererEvent, unseen: number) => void;
    "get-total-mails": (_: IpcRendererEvent, total: number) => void;
};

type EventListener<T, K extends Keys<T>> = T[K] extends (event: IpcRendererEvent, ...args: any[]) => any ? T[K] : (event: IpcRendererEvent, ...args: any[]) => void;

contextBridge.exposeInMainWorld("ipcRenderer", {
    request: <K extends Keys<RequestMap>>(channel: K, ...args: [RequestMap[K]]): void => ipcRenderer.send(channel, args),
    invoke: <K extends Keys<InvokeMap>>(channel: K, ...args: MapParameter<InvokeMap, K>): Promise<ReturnType<InvokeMap, K>> => ipcRenderer.invoke(channel, args),
    on: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>): Electron.IpcRenderer => ipcRenderer.on(channel, listener),
    once: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>): Electron.IpcRenderer => ipcRenderer.once(channel, listener),
});

export interface IpcRenderer {
    request: <K extends Keys<RequestMap>>(channel: K, ...args: [RequestMap[K]]) => void,
    invoke: <K extends Keys<InvokeMap>>(channel: K, ...args: MapParameter<InvokeMap, K>) => Promise<ReturnType<InvokeMap, K>>,
    on: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>) => Electron.IpcRenderer,
    once: <K extends Keys<ReceiveMap>>(channel: K, listener: EventListener<ReceiveMap, K>) => Electron.IpcRenderer,
}