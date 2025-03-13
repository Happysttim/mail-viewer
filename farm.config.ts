import { defineConfig } from "@farmfe/core";
import electron from "@farmfe/js-plugin-electron"; 

export default defineConfig({
    plugins: [
        "@farmfe/plugin-react",
        electron({
            main: {
                input: "./app/index.ts",
            },
            preload: {
                input: "./app/preload/index.ts",
            },
        }),
    ],
    compilation: {
        input: {
            index: "./app/render/index.html",
        },
        output: {
            path: "build",
            publicPath: "/",
            targetEnv: "browser-esnext",
        },
    },
});