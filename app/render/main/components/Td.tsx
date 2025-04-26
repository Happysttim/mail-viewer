import React, { HTMLAttributes, memo, ReactNode } from "react";

type TdProps = {
    hover?: string[];
    width?: number | "auto";
    onClick?: () => void;
    label?: string;
    icon?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const Td = ({ width = "auto", onClick, label, icon, className }: TdProps) => {

    if (icon) {
        return (
            <div style={{
                width,
            }} className={`${className}`} onClick={onClick}> 
                { icon } 
            </div>
        );
    }

    if (label) {
        return (
            <span className={`${className}`} onClick={onClick}>
                { label }
            </span>
        );
    }

    return (
        <div style={{
            width,
        }} className={`${className}`} onClick={onClick}></div>
    );
};