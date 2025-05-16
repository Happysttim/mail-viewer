import React from "react";

type ButtonType = "YES" | "NO";

type ButtonProp = {
    type: ButtonType;
    text: string;
    onClick?: () => void;
};

export const Button = ({ type, text, onClick }: ButtonProp) => {
    
    const color = {
        "YES": "bg-[#7EAF4F]",
        "NO": "bg-[#FF6E40]",
    }[type];
    
    return (
        <button className={`p-3 pl-10 pr-10 mr-10 rounded-lg text-lg text-white ${color}`} onMouseDown={onClick}>
            { text }
        </button>
    );
};