import React, { ReactNode } from "react";

type ContentProp = {
    children: ReactNode,
};

export const Content = ({ children }: ContentProp) => {
    return (
        <div className="h-full w-full flex flex-col p-5 overflow-auto">
            { children }
        </div>
    );
};