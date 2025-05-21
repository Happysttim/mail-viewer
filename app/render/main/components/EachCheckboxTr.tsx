import React, { ReactNode, useEffect, useState } from "react";

type EachCheckboxTrProps<T> = {
    checked?: boolean;
    height?: number;
    onChange?: (value: boolean) => void;
    data: T,
    children: (data: T) => ReactNode;
};

export const EachCheckboxTr = <T,>({ checked = false, height = 40, onChange, data, children }: EachCheckboxTrProps<T>) => {

    const [ checkedTr, setCheckedTr ] = useState(checked);

    useEffect(() => {
        setCheckedTr(checked);
    }, [ checked ]);

    useEffect(() => {
        if (onChange) {
            onChange(checkedTr);
        }
    }, [ checkedTr ]);

    return (
        <div style={{
            minHeight: `${height}px`,
        }} className="flex w-full p-2 border-t border-[#969696] boder-solid items-center">
            <div className="flex w-full items-center">
                <input type="checkbox" checked={checkedTr} onChange={() => setCheckedTr(!checkedTr)} className="w-4 h-4 mr-4 rounded-sm" />
                {
                    children(data)
                }
            </div>
        </div>
    );
};