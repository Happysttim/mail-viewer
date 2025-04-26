import React, { useState } from "react";
import { StreamColorAvatar } from "./StreamColorAvatar";
import { useDropdown } from "../../common/hooks/useDropdown";
import { DropMenu } from "./DropMenu";

type StreamItemProps = {
    defaultName: string,
    aliasName?: string,
    profileColor: string,
    notificate?: boolean,
    selected?: boolean,
};

export const StreamItem = ({ defaultName, aliasName, profileColor, notificate = false, selected = false }: StreamItemProps) => {
    const name = aliasName || defaultName;
    const { open, setOpen, ref, dropdownRef } = useDropdown();
    const [ position, setPosition ] = useState({ x: 0, y: 0 });

    const handleClick = () => {
        const { left, bottom } = ref.current?.getBoundingClientRect() || { left: 0, bottom: 0 };
        setPosition({ x: left + 20, y: bottom - 35 });
        setOpen(true);
    };

    return (
        <div className="w-full h-full flex items-center">
            <StreamColorAvatar colorCode={profileColor} dotBadge={notificate} />
            <div className="ml-2 items-center overflow-hidden flex">
                <span className={`w-36 text-ellipsis overflow-hidden whitespace-nowrap text-sm ${selected ? "text-gray-500" : "text-gray-50"}`}>{ name }</span>
                <div ref={ref} className="ml-2 hover:cursor-pointer" onClick={handleClick}>
                    <svg xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 30 30">
                        <circle cx="9" cy="15" r="2" fill="#D9D9D9" />
                        <circle cx="15" cy="15" r="2" fill="#D9D9D9" />
                        <circle cx="21" cy="15" r="2" fill="#D9D9D9" />   
                    </svg>
                    {
                        open && <DropMenu ref={dropdownRef} x={position.x} y={position.y} items={[
                            {
                                label: "수정하기",
                                onClick: () => {
                                    console.log("Rename Clicked");
                                    setOpen(false);
                                },
                            },
                            {
                                label: "삭제하기",
                                labelColor: "#FF0000",
                                onClick: () => {
                                    console.log("Delete Clicked");
                                    setOpen(false);
                                },
                            },
                        ]} />
                    }
                </div>
            </div>
        </div>
    );
};