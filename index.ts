import { app as electronApp } from "electron";
import { App } from "app";
import { createUserTable } from "lib/database";

electronApp.whenReady().then(async () => {
    await createUserTable();
    const app = new App();

    app.initEntryWindow();
    app.ipcMainHook();
});