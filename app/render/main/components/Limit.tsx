import { useDropdown } from "app/render/common/hooks/useDropdown";
import React, { useEffect, useState } from "react";

type LimitProps = {
    value: number;
    limitOptions: number[];
    onChange?: (value: number) => void;
};

export const Limit = ({ value, limitOptions, onChange }: LimitProps) => {

    const [ limit, setLimit ] = useState(0);
    const { dropdownRef, open, setOpen, targetRef } = useDropdown();

    useEffect(() => {
        setLimit(value);
    }, [ value ]);

    return (
        <div className="w-28">
            <div 
                ref={dropdownRef} 
                className="p-2 border border-gray-400 rounded-md flex items-center justify-center" 
                onClick={() => setOpen(!open)}
            >
                <span className="text-black tracking-tighter font-bold w-full">{ limit }통</span>
                <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-black rotate-45 mr-1"></div>
            </div>
            {
                open && <div ref={targetRef} className="absolute border border-gray-400 w-28">
                    {
                        limitOptions.map((value, i) => {
                            return (
                                <p
                                    key={i}
                                    onMouseDown={() => {
                                        setLimit(value);
                                        if (onChange) {
                                            onChange(value);
                                        }
                                    }} 
                                    className={`${ limit === value ? "bg-gray-400" : "bg-white" } w-full p-3 tracking-tighter text-black not-last:border-b not-last:border-gray-400`}
                                >
                                    { value }통
                                </p>
                            );
                        })
                    }
                </div>
            }
        </div>
    );

};