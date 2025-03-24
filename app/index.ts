import { app as electronApp, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import dotenv from "dotenv";

if (!electronApp.isPackaged) {
    dotenv.config({ path: ".env.development.local" });
}

const browserPath = electronApp.isPackaged ? "." : `http://${process.env.SERVER_HOST || "localhost"}:${process.env.PORTT || "9000"}`;

export class App {

    private loginWindow: BrowserWindow | undefined;

    initWindows() {
        this.loginWindow = new BrowserWindow({
            width: 600,
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
            this.loginWindow.loadURL(`${browserPath}/login.html`);
            this.loginWindow.webContents.openDevTools();
        } else {
            this.loginWindow.loadFile(`${browserPath}/login.html`);
        }

        this.ipcRendererRequest(this.loginWindow);
        this.loginWindow.show();
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