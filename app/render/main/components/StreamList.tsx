import React, { ReactNode, useState } from "react";

type StreamListProp<T> = {
    items: T[],
    renderItem: (value: T, selected: boolean) => ReactNode,
    onClick: (value: T) => void,
};

export const StreamList = <T,>({ items, renderItem, onClick }: StreamListProp<T>) => {

    const [ select, setSelect ] = useState(-1);
    
    return (
        <div className="w-full bg-inherit">
            {
                items && items.map((v, idx) => {
                    return (
                        <div key={idx} className={`w-auto pl-2 h-14 flex items-center ${select === idx ? "bg-white" : "hover:bg-[#696969] hover:cursor-pointer"}`} onClick={() => { 
                            setSelect(idx);
                            onClick(v); 
                        }}>
                            { renderItem(v, select == idx) }
                        </div>
                    );
                })
            }
        </div>
    );
};