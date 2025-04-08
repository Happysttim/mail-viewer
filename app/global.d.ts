import { IpcRenderer } from "./preload";

declare global {
    interface Window {
        ipcRenderer: IpcRenderer
    }
}