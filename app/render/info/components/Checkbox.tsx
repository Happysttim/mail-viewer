import React, { useState } from "react";

type CheckboxProps = {
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
};

export const Checkbox = ({ label, checked = false, onChange }: CheckboxProps) => {

    const [ check, setCheck ] = useState(checked);

    return (
        <div className="flex items-center" onClick={() => { 
            setCheck(!check);
            if (onChange) {
                onChange(check);
            } 
        }}>
            <label className="text-lg mr-2">{ label }</label>
            <div className="w-4 h-4 flex items-center justify-center border rounded-sm bg-[#D9D9D9]">
                {
                    check && <div className="w-3 h-3 rounded-sm bg-[#333333]"></div>
                }
            </div>
        </div>
    );
};