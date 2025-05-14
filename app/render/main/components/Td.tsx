import React, { HTMLAttributes, memo, ReactNode } from "react";

type TdProps = {
    hover?: string[];
    width?: number | "auto";
    onClick?: () => void;
    label?: string;
    tooltip?: string;
    icon?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const Td = ({ width = "auto", onClick, label, icon, className, tooltip }: TdProps) => {

    if (icon) {
        return (
            <div style={{
                width,
            }} className={`${className}`} title={tooltip} onClick={onClick}> 
                { icon } 
            </div>
        );
    }

    if (label) {
        return (
            <span className={`${className}`} title={tooltip} onClick={onClick}>
                { label }
            </span>
        );
    }

    return (
        <div style={{
            width,
        }} className={`${className}`} title={tooltip} onClick={onClick}></div>
    );
};