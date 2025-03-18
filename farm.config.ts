import { defineConfig } from "@farmfe/core";
import electron from "@farmfe/js-plugin-electron";
import farmPostcss from "@farmfe/js-plugin-postcss"; 
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development.local" });

export default defineConfig({
    server: {
        port: parseInt(process.env.PORT || "9000"),
        hmr: true,
        cors: true,
    },
    plugins: [
        "@farmfe/plugin-react",
        farmPostcss(),
        electron({
            main: {
                input: path.join(__dirname, "./index.ts"),
                farm: {
                    compilation: {
                        minify: false,
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
                        minify: false,
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