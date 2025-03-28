import React, { useEffect, useState } from "react";

type Symbol = "MINIMUM" | "MAXIMUM" | "CLOSE";
type TitleBarProp = {
    symbols: Symbol[],
};

const SymbolMinimum = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30">
            <path d="M8,15 h15" stroke="white" strokeWidth="0.5" />    
        </svg>
    );
};

const SymbolMaximum = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30">
            <path d="M10,10 H20 V20 H10 V10z" fill="transparent" stroke="white" strokeWidth="0.5" />
        </svg>
    );
};

const SymbolClose = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30">
            <path d="M10,10 l10,10 M20,10 l-10,10" stroke="white" strokeWidth="0.5" />
        </svg>
    );
};

const SymbolUnmaximum = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30">
            <path d="M10,10 h10 v10 h-10 v-10z" fill="transparent" stroke="white" strokeWidth="0.5" />
            <path d="M13,10 v-3 h10 v10 h-3 m0,0z" fill="transparent" stroke="white" strokeWidth="0.5" />
        </svg>
    );
};

export const TitleBar = ({ symbols }: TitleBarProp) => {

    const [ expand, setExpand ] = useState(false);
    const handleExpand = (action: "CLOSE" | "MINIMUM" | "MAXIMUM" | "UNMAXIMUM") => {
        if (action === "UNMAXIMUM" || action === "MAXIMUM") {
            setExpand(!expand);
        }
        window.ipcRenderer.request("request-win-control", action);
    };

    useEffect(() => {
        window.ipcRenderer.on("request-expand", (_, onExpand) => {
            setExpand(onExpand);
        });
    }, []);

    return (
        <div className="appRegionDrag fixed h-30 w-full bg-inherit top-0">
            <div className="flex justify-end">
                <div className="appRegionNoDrag flex">
                    {
                        symbols.length > 0 && symbols.map((v) => {
                            if (v === "MINIMUM") {
                                return (
                                    <div className="titlebar-symbol hover:bg-black/10" onClick={() => handleExpand("MINIMUM")}>
                                        <SymbolMinimum />
                                    </div>
                                );
                            }
                            if (v === "MAXIMUM") {
                                return (
                                    <div className="titlebar-symbol hover:bg-black/10" onClick={() => handleExpand(expand ? "UNMAXIMUM" : "MAXIMUM")}>
                                        {
                                            expand ? <SymbolUnmaximum /> : <SymbolMaximum />
                                        }
                                    </div>
                                );
                            }
                            return (
                                <div className="titlebar-symbol hover:bg-red-400/50" onClick={() => handleExpand("CLOSE")}>
                                    <SymbolClose />
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
};
