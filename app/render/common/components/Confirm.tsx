import React, { ReactNode, RefObject, useImperativeHandle, useState } from "react";
import { Overlay } from "./Overlay";

export type ConfirmRef = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};

type ConfirmProps = {
    children: ReactNode;
    title: string;
    onClickYes?: () => void;
    onClickCancel?: () => void;
    ref: RefObject<ConfirmRef>;
};

export const Confirm = ({ children, title, onClickYes, onClickCancel, ref }: ConfirmProps) => {
    const [ isOpen, setIsOpen ] = useState(false);

    useImperativeHandle(ref, () => {
        return {
            isOpen,
            open: () => setIsOpen(true),
            close: () => setIsOpen(false),
        };
    });

    return isOpen && (
        <Overlay>
            <div className="absolute z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-400 bg-white p-3 w-[400px]">
                <p className="text-lg font-bold mb-2">{ title }</p>
                { children }
                <div className="flex items-center mt-4">
                    { onClickYes && <button className="p-1 pr-3 pl-3 border border-gray-400 bg-blue-400 text-white rounded-md mr-4" onClick={onClickYes}>예</button> }
                    { onClickCancel && <button className="p-1 pr-3 pl-3 border border-gray-400 bg-white rounded-md mr-4" onClick={onClickCancel}>아니오</button> }
                </div>
            </div>
        </Overlay>  
    );
};