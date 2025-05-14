import React, { useEffect, useState } from "react";
import { BadgeType, StreamColorAvatar } from "./StreamColorAvatar";
import { useDropdown } from "../../common/hooks/useDropdown";
import { DropMenu } from "./DropMenu";
import { StreamDTO } from "lib/database/dto";

type StreamItemProps = {
    item: StreamDTO;
    defaultName: string;
    profileColor: string;
    aliasName?: string;
    badge: BadgeType;
    selected?: boolean;
};

export const StreamItem = ({ item, defaultName, aliasName, profileColor, badge = "NORMAL", selected = false }: StreamItemProps) => {
    const name = aliasName || defaultName;
    const { open, setOpen, targetRef, dropdownRef } = useDropdown();
    const [ position, setPosition ] = useState({ x: 0, y: 0 });
    const [ badgeType, setBadgeType ] = useState<BadgeType>(badge);

    useEffect(() => {
        setBadgeType(badge);
    }, [ badge ]);

    const handleClick = () => {
        const { left, bottom } = targetRef.current?.getBoundingClientRect() || { left: 0, bottom: 0 };
        setPosition({ x: left + 20, y: bottom - 35 });
        setOpen(true);
    };

    return (
        <div className="w-full h-full flex items-center">
            <StreamColorAvatar colorCode={profileColor} badge={badgeType} />
            <div className="ml-2 items-center overflow-hidden flex">
                <span className={`w-36 text-ellipsis overflow-hidden whitespace-nowrap text-sm ${selected ? "text-gray-500" : "text-gray-50"}`}>{ name }</span>
                <div ref={targetRef} className="ml-2 hover:cursor-pointer" onClick={handleClick}>
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
                                label: "새로고침",
                                onClick: () => {
                                    setBadgeType("RELOAD");
                                    window.ipcRenderer.invoke("reload-stream", item).then((result) => {
                                        setBadgeType(result ? "NORMAL" : "ERROR");   
                                    }).catch(() => {
                                        setBadgeType("ERROR");
                                    });
                                    setOpen(false);
                                }
                            },
                            {
                                label: "수정하기",
                                onClick: () => {
                                    window.ipcRenderer.request("request-stream", item);
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