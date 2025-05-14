import React, { Ref, useImperativeHandle, useState } from "react";
import { IconButton } from "./IconButton";
import { createPortal } from "react-dom";
import { useDropdown } from "../../common/hooks/useDropdown";

type PagenationRef = {
    setPage: (page: number) => void;
    page: number;
};

type PagenationProps = {
    ref?: Ref<PagenationRef>;
    showChunk: number;
    total: number;
    current: number;
    onPageChange: (page: number) => void;
    onNextChunk: () => void;
    onPrevChunk: () => void;
};

type SelectPageMenuProps = {
    ref: Ref<HTMLDivElement>;
    x: number;
    y: number;
    current: number;
    total: number;
    chunk: number;
    onPageChange: (page: number) => void;
};

const PrevIcon = () => {
    return (
        <svg width="19" height="20" viewBox="0 0 19 20" xmlns="http://www.w3.org/2000/svg">
            <mask id="path-1-inside-1_8_140" fill="gray">
                <path d="M18.3848 10L9.19238 19.1924L-1.03712e-05 10L9.19238 0.807612L18.3848 10Z"/>
            </mask>
            <path d="M-1.03712e-05 10L-2.82844 7.17157L-5.65686 10L-2.82844 12.8284L-1.03712e-05 10ZM12.0208 16.364L2.82842 7.17157L-2.82844 12.8284L6.36395 22.0208L12.0208 16.364ZM2.82842 12.8284L12.0208 3.63604L6.36395 -2.02082L-2.82844 7.17157L2.82842 12.8284Z" fill="black" mask="url(#path-1-inside-1_8_140)"/>
        </svg>
    );
};

const NextIcon = () => {
    return (
        <svg width="19" height="20" viewBox="0 0 19 20" xmlns="http://www.w3.org/2000/svg">
            <mask id="path-1-inside-1_34_45" fill="gray">
                <path d="M0 10L9.19239 0.807612L18.3848 10L9.19239 19.1924L0 10Z"/>
            </mask>
            <path d="M18.3848 10L21.2132 12.8284L24.0416 10L21.2132 7.17157L18.3848 10ZM6.36396 3.63604L15.5563 12.8284L21.2132 7.17157L12.0208 -2.02082L6.36396 3.63604ZM15.5563 7.17157L6.36396 16.364L12.0208 22.0208L21.2132 12.8284L15.5563 7.17157Z" fill="black" mask="url(#path-1-inside-1_34_45)"/>
        </svg>
    );
};

const OtherIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="20"
            viewBox="0 0 19 20">
            <circle cx="3" cy="15" r="2" fill="#D9D9D9" />
            <circle cx="9" cy="15" r="2" fill="#D9D9D9" />
            <circle cx="15" cy="15" r="2" fill="#D9D9D9" />   
        </svg>
    );
};

const SelectPageMenu = ({ ref, x, y, current, total, onPageChange }: SelectPageMenuProps) => {
    return createPortal(
        <div style={{
            left: x,
            top: y,
        }} className="absolute w-52 h-28 overflow-y-auto border border-solid border-gray-400 bg-white rounded-md" ref={ref}>
            { 
                [...Array(total).keys()].map((i) => {
                    return (
                        <button 
                            key={i} 
                            className={`w-8 h-8 rounded-md text-black font-bold mr-2 ${i + 1 == current ? "bg-[#858181]" : "bg-inherit hover:bg-[#BFBFBF]"}`}
                            onMouseDown={() => onPageChange(i + 1)}
                        >{ i + 1 }</button>
                    );
                })
            }
        </div>
    , document.body);
};

export const Pagenation = ({ ref, showChunk, total, current, onPageChange, onNextChunk, onPrevChunk }: PagenationProps) => {

    const { open, setOpen, dropdownRef, ...prop } = useDropdown();
    const [ position, setPosition ] = useState({ x: 0, y: 0 });
    const handleClick = () => {
        const { left, bottom } = prop.targetRef.current?.getBoundingClientRect() || { left: 0, bottom: 0 };
        setPosition({ x: left - 112, y: bottom - 150 });
        setOpen(true);
    };

    useImperativeHandle(ref , () => {
        return {
            setPage: (page: number) => {
                onPageChange(page);
            },
            page: current,
        };
    });

    return (
        <div className="flex justify-center items-center">
            <IconButton icon={<PrevIcon />} className="w-8 h-8 items-center justify-center flex mr-2" onClick={onPrevChunk} />
            { 
                [...Array(showChunk).keys()].map((i) => i + Math.max(current - Math.floor(showChunk / 2), 1)).filter((i) => i <= total).map((i) => {
                    return (
                        <button key={i} className={`w-8 h-8 rounded-md text-black mr-2 ${i == current ? "bg-[#858181]" : "bg-inherit hover:bg-[#BFBFBF]"}`} onClick={() => onPageChange(i)}>{ i }</button>
                    );
                })
            }
            <div ref={prop.targetRef}>
                <IconButton icon={<OtherIcon />} className="w-8 h-8 items-center justify-center flex mr-2" onClick={handleClick} />
                {
                    open && <SelectPageMenu ref={dropdownRef} x={position.x} y={position.y} current={current} total={total} chunk={showChunk} onPageChange={(page) => {
                        onPageChange(page);
                        setOpen(false);
                    }} />
                }
            </div>
            <IconButton icon={<NextIcon />} className="w-8 h-8 items-center justify-center flex" onClick={onNextChunk} />
        </div>
    );

};