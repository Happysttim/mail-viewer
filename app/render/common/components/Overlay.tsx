import React, { ReactNode } from "react";
import { createPortal } from "react-dom";

type OverlayProps = {
    children: ReactNode;
};

export const Overlay = ({ children }: OverlayProps) => {
    return createPortal(
        <div className="absolute top-0 left-0 w-screen h-screen overflow-hidden bg-black/30">
            { children }
        </div>, document.body
    );
};