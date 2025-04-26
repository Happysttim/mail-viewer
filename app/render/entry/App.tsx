import React from "react";
import { TitleBar } from "../common/TitleBar";
import { Entry } from "./components/Entry";

export const App = () => {
    return (
        <div className="absolute top-0 w-full h-full bg-gradient-to-br from-[#709FD6] to-[#A5A5A5] overflow-hidden">
            <TitleBar symbols={["MINIMUM", "CLOSE"]} />
            <Entry />
        </div>
    );
};