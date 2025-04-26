import React, { ReactNode } from "react";

type PanelItemProps = {
    onClick?: () => void,
    divider?: boolean,
    bottomPosition?: boolean,
    label?: string,
    children: ReactNode,
};

export const PanelItem = ({ onClick, divider = false, bottomPosition = false, label, children }: PanelItemProps) => {  
    const dividerClassName = divider ? "not-last:border-b not-first:border-t border-solid border-[#B0B0B0]" : "";
    const positionClassName = bottomPosition ? "mt-auto" : "";

    return (
        <>
            <div className={`w-auto flex mb-1 mt-1 ${dividerClassName} ${positionClassName}`} onClick={onClick}>
            {
                label && (
                    <div className="hidden h-auto ml-1 mt-1 lg:flex align-middle">
                        <span className="tracking-tight text-[12px] text-[#ffffff]">{ label }</span>
                    </div>
                )
            }
            {
                children
            }
            </div>
        </>
    );
};