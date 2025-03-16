import { IpcRenderer } from "./preload";
import { Observe } from "./type";

declare global {
    interface Window {
        ipcRenderer: IpcRenderer
        observe: Observe
    }
}