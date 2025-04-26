import React, { ReactNode } from "react";

type PanelProp = {
    children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>;

export const Panel = ({ children }: PanelProp) => {
    
    return (
        <div className="stream-panel">
            { children }
        </div>
    );
};