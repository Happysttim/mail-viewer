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
        <div className="w-28 p-3">
            <p ref={dropdownRef} className="w-full inset-ring-2 shadow-xl bg-gray-400 rounded-md text-sm text-black tracking-tighter font-bold" onClick={() => setOpen(!open)}>{ limit }</p>
            <div ref={targetRef} className="absolute w-full p-3">
                {
                    limitOptions && limitOptions.map((value) => {
                        return (
                            <p
                                onMouseDown={() => {
                                    setLimit(value);
                                    if (onChange) {
                                        onChange(value);
                                    }
                                }} 
                                className={`${ limit === value ? "bg-gray-400" : "bg-white" } tracking-tighter text-black not-last:border-b not-last:border-gray-400`}
                            >
                                { value }
                            </p>
                        );
                    })
                }
            </div>
        </div>
    );

};