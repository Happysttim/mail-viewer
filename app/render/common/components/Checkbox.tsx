import React, { RefObject, useImperativeHandle, useState } from "react";

export type CheckboxRef = {
    value: boolean;
    setValue: (value: boolean) => void;
};

type CheckboxProps = {
    label: string;
    ref?: RefObject<CheckboxRef>;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
};

export const Checkbox = ({ label, ref, checked = false, onChange }: CheckboxProps) => {

    const [ check, setCheck ] = useState(checked);

    useImperativeHandle(ref, () => {
        return {
            value: check,
            setValue: (v: boolean) => {
                setCheck(v);
                if (onChange && v !== check) {
                    onChange(v);
                }
            },
        };
    });

    return (
        <div className="flex items-center mr-4 ml-4" onClick={() => { 
            setCheck(!check);
            if (onChange) {
                onChange(check);
            } 
        }}>
            <label className="text-lg mr-2">{ label }</label>
            <div className="w-4 h-4 flex items-center justify-center border rounded-sm bg-[#D9D9D9]">
                {
                    (check ? <div className="w-3 h-3 rounded-sm bg-[#333333]"></div> : <></>)
                }
            </div>
        </div>
    );
};