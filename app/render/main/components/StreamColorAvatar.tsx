import { Processing } from "app/render/common/components/Processing";
import React from "react";

export type BadgeType = "NORMAL" | "ERROR" | "NOTIFICATE" | "RELOAD";
type StreamColorAvatarProp = {
    colorCode: string;
    badge: BadgeType;
};

export const StreamColorAvatar = ({ colorCode, badge }: StreamColorAvatarProp) => {
    return (
        <div className="w-auto h-auto relative">
            <div style={{
                backgroundColor: colorCode,
            }} className="w-6 h-6 rounded-full">
            </div>
            {
                badge === "RELOAD" && (
                    <div className="absolute w-2 h-2 rounded-full translate-x-4 -translate-y-6">
                        <Processing height={6} width={6} stroke="darkgray" />
                    </div>
                )
            }
            {
                badge === "ERROR" && (
                    <div className="absolute w-5 h-5 translate-x-3 -translate-y-6">
                        <div className="absolute bg-red-500 -rotate-45 w-3 h-0.5"></div>
                        <div className="absolute bg-red-500 rotate-45 w-3 h-0.5"></div>
                    </div>
                )
            }
            {
                badge === "NOTIFICATE" && (
                    <div className="absolute w-2 h-2 rounded-full translate-x-4 -translate-y-6 bg-red-500">
                    </div>
                )
            }
        </div>
    );
};