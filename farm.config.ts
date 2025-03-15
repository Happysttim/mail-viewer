import { defineConfig } from "@farmfe/core";
import electron from "@farmfe/js-plugin-electron"; 
import path from "node:path";

export default defineConfig({
    server: {
        port: 9000,
        hmr: true,
        cors: true,
    },
    plugins: [
        [
            "@farmfe/plugin-react",
            {
                refresh: process.env.NODE_ENV === "development",
                development: process.env.NODE_ENV === "development"
            },
        ],
        electron({
            main: {
                input: path.join(__dirname, "./index.ts"),
                farm: {
                    compilation: {
                        sourcemap: false,
                        external: ["electron"],
                        externalNodeBuiltins: true,
                        output: {
                            targetEnv: "node-next",
                            path: "build",
                            publicPath: "./",
                        },
                    }
                }
            },
            preload: {
                input: path.join(__dirname, "./app/preload.ts"),
                farm: {
                    compilation: {
                        sourcemap: false,
                        external: ["electron"],
                        externalNodeBuiltins: true,
                        output: {
                            targetEnv: "node-next",
                            path: "build",
                            publicPath: "./",
                        }
                    }
                }
            },
        }),
    ],
    compilation: {
        sourcemap: false,
        input: {
            login: path.join(__dirname, "./app/render/login.html"),
        },
        output: {
            path: "build",
            targetEnv: "browser-esnext",
            publicPath: "./",
        },
    },
});