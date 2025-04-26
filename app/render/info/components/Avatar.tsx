import React, { useEffect, useRef, useState } from "react";
import ColorPicker from "@rc-component/color-picker";
import "@rc-component/color-picker/assets/index.css";
import { createPortal } from "react-dom";

type AvatarProps = {
    color: string;
    onChange?: (color: string) => void;
};

export const Avatar = ({ color, onChange }: AvatarProps) => {

    const [ open, setOpen ] = useState(false);
    const [ selectColor, setColor ] = useState(color);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const refHandler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.body.addEventListener("mousedown", refHandler);

        return () => {
            document.body.removeEventListener("mousedown", refHandler);
        };
    }, []);

    return (
        <div className="w-[150px] h-[200px] p-2 rounded-md bg-[#F5F5F5] border border-[#9A9A9A]">
            <p className="relative w-full h-auto text-[10px] text-black tracking-wider font-bold">프로필 색깔</p>
            <div style={{
                backgroundColor: selectColor,
            }} className=" w-32 h-32 rounded-full border border-[#9A9A9A] m-auto mt-5 cursor-pointer" onClick={() => setOpen(true)}></div>
            {
                open && createPortal(<ColorPicker
                    className="absolute z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    value={selectColor}
                    ref={ref}
                    onChangeComplete={(color) => {
                        setColor(color.toHexString());
                        setOpen(false);
                        if (onChange) {
                            onChange(color.toHexString());
                        }
                    }}
                />, document.body)
        }
        </div>
    );
};