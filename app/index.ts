import { app as electronApp, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import dotenv from "dotenv";

if (!electronApp.isPackaged) {
    dotenv.config({ path: ".env.development.local" });
}

const browserPath = electronApp.isPackaged ? "." : `http://${process.env.SERVER_HOST || "localhost"}:${process.env.PORTT || "9000"}`;

export class App {

    private entryWindow: BrowserWindow | undefined;
    private mainWindow: BrowserWindow | undefined;
    private infoWindow: BrowserWindow | undefined;

    initEntryWindow() {
        this.entryWindow = new BrowserWindow({
            width: 600,
            height: 800,
            focusable: true,
            resizable: false,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.entryWindow.loadURL(`${browserPath}/entry.html`);
            this.entryWindow.webContents.openDevTools();
        } else {
            this.entryWindow.loadFile(`${browserPath}/entry.html`);
        }

        this.ipcRendererRequest(this.entryWindow);
        this.entryWindow.show();
    }

    initMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1080,
            height: 800,
            focusable: true,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.mainWindow.loadURL(`${browserPath}/main.html`);
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(`${browserPath}/main.html`);
        }

        this.ipcRendererRequest(this.mainWindow);
        this.mainWindow.show();
    }

    initInfoWindow() {
        this.infoWindow = new BrowserWindow({
            width: 600,
            height: 550,
            focusable: true,
            resizable: false,
            titleBarStyle: "hidden",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, "preload.js")
            }
        });

        if (!electronApp.isPackaged) {
            this.infoWindow.loadURL(`${browserPath}/info.html`);
            this.infoWindow.webContents.openDevTools();
        } else {
            this.infoWindow.loadFile(`${browserPath}/info.html`);
        }

        this.ipcRendererRequest(this.infoWindow);
        this.infoWindow.show();
    }

    ipcMainHook() {
        ipcMain.on("request-win-control", (_, [ action ]) => {
            const currentWindow = BrowserWindow.getFocusedWindow();
            if (!currentWindow) {
                return;
            }
            switch (action) {
                case "MAXIMUM":
                    currentWindow.maximize();
                    break;
                case "MINIMUM":
                    currentWindow.minimize();
                    break;
                case "UNMAXIMUM":
                    currentWindow.unmaximize();
                    break;
                case "CLOSE":
                    currentWindow.close();
                    break;
            }
        });
    }

    ipcRendererRequest(browserWindow: BrowserWindow) {
        browserWindow.on("minimize", () => {
            browserWindow.webContents.send("request-expand", false);
        });

        browserWindow.on("maximize", () => {
            browserWindow.webContents.send("request-expand", true);
        });
    }
}