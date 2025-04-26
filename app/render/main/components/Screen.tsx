import React, { ReactNode } from "react";
import { StreamIdProvider } from "../contexts/StreamIdContext";

type ScreenProp = {
    children: ReactNode,
};

export const Screen = ({ children }: ScreenProp) => {
    return (
        <div className="w-full h-full flex overflow-hidden">
            <StreamIdProvider>
                { children }
            </StreamIdProvider>
        </div>
    );
};