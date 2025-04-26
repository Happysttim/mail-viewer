import React from "react";
import { createPortal } from "react-dom";

type DropMenuItem = {
    label: string,
    labelColor?: string,
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
};

type DropMenuProps = {
    items: DropMenuItem[],
    x: number,
    y: number,
    ref: React.RefObject<HTMLDivElement>,
};

export const DropMenu = ({ items, x, y, ref }: DropMenuProps) => {
    return createPortal(
        <div ref={ref} style={{
            transform: `translate3d(${x}px, ${y}px, 0)`,
        }} className="left-0 top-0 absolute z-50 bg-white rounded-md w-30 h-auto border border-solid border-black">
            {
                items.map(({ label, labelColor = "#000000", onClick }, idx) => {
                    return (
                        <div key={idx} className="w-full p-2 hover:bg-[#D9D9D9] hover:cursor-pointer hover:first:rounded-t-md hover:last:rounded-b-md" onMouseDown={onClick}>
                            <span style={{
                                color: labelColor,
                            }} className="tracking-tighter text-sm">{ label }</span>
                        </div>
                    );
                })
            }
        </div> 
    , document.body);
};