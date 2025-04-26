import React, { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type IconButtonProps = {
    ref?: Ref<HTMLButtonElement>;
    icon: ReactNode,
    label?: string,
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = ({ ref, icon, label, onClick, className, style, ...props }: IconButtonProps) => {
    return (
            label ? (
            <button ref={ref} onClick={onClick} {...props} style={style} className={className}>
            {
                <>
                    <div className="flex w-8 h-8 bg-[#646464] rounded-md items-center justify-center">
                    {
                        icon
                    }
                    </div>
                    <span className="flex w-32 tracking-[4px] justify-center text-ellipsis overflow-hidden whitespace-nowrap ml-3 text-lg text-white">{ label }</span>
                </>
            }
            </button>
        ) : (
            <button ref={ref} onClick={onClick} {...props} style={style} className={className}>
                { icon }
            </button>
        )
    );
};