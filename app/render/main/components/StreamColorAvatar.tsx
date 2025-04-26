import React from "react";

type StreamColorAvatarProp = {
    colorCode: string,
    dotBadge: boolean,
};

export const StreamColorAvatar = ({ colorCode, dotBadge }: StreamColorAvatarProp) => {
    return (
        <div className="w-auto h-auto relative">
            <div style={{
                backgroundColor: colorCode,
            }} className="w-6 h-6 rounded-full">
            </div>
            {
                dotBadge && (
                    <div className="absolute w-2 h-2 rounded-full translate-x-4 -translate-y-6 bg-red-500">
                    </div>
                )
            }
        </div>
    );
};