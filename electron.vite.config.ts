import { externalizeDepsPlugin, defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                "app": path.resolve(__dirname, "app"),
                "lib": path.resolve(__dirname, "lib"),
            }
        },
        build: {
            outDir: "build",
            rollupOptions: {
                external: [
                    "electron",
                    "better-sqlite3-multiple-ciphers",
                ],
                input: {
                    index: path.resolve(__dirname, "index.ts")
                },
                output: {
                    entryFileNames: "index.js",
                },
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: "build/preload",
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, "app/preload.ts")
                },
                output: {
                    entryFileNames: "preload.js",
                },
            }
        }
    },
    renderer: {
        root: path.resolve(__dirname, "app/render"),
        resolve: {
            alias: {
                "app": path.resolve(__dirname, "app"),
                "lib": path.resolve(__dirname, "lib"),
            },
            extensions: [".tsx", ".jsx", ".ts", ".js"]
        },
        build: {
            outDir: "build",
            rollupOptions: {
                input: {
                    entry: path.join(__dirname, "./app/render/entry.html"),
                    main: path.join(__dirname, "./app/render/main.html"),
                    info: path.join(__dirname, "./app/render/info.html"),
                },
            }
        },
        plugins: [react()]
    },
});