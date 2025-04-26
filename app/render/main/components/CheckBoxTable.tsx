import React, { ReactNode } from "react";

type CheckBoxTableProp<T> = {
    bind: T[],
    children: (checked: boolean, data: T) => ReactNode;
    checked?: boolean;
};

export const CheckBoxTable = <T,>({ bind, children, checked = false }: CheckBoxTableProp<T>) => {
    return (
        <div className="w-full flex-1 border-t min-w-[800px] border-[#969696] border-solid mt-10">
            {
                bind.map((value) => {
                    return children(checked, value);
                })
            }
        </div>
    );
};
