import React, { RefObject, useEffect, useId, useImperativeHandle, useState } from "react";
import { useDropdown } from "../../common/hooks/useDropdown";

export type DropdownRef = {
    selectedOption: DropdownOption;
    setValue: (value: string) => void;
    index: number;
};

type DropdownOption = {
    display: string;
    value: string;
};

type DropdownProps = {
    options: DropdownOption[];
    width: number | "auto" | "full";
    ref?: RefObject<DropdownRef>;
    selected?: number;
    onChange?: (value: DropdownOption) => void;
};

type InputTextProps = {
    type: "text" | "password";
    placeholder?: string;
    value?: string;
    ref?: RefObject<HTMLInputElement>;
    onChange?: (value: string) => void;
};

type InputProps = {
    label: string;
    width: number | "auto" | "full";
} & (
    | {
        type: "text" | "password";
        ref?: RefObject<HTMLInputElement>;
        placeholder?: string;
        value?: string;
        onChange?: (value: string) => void;
    } | {
        type: "dropdown";
        options: DropdownOption[];
        ref?: RefObject<DropdownRef>;
        selected?: number;
        onChange?: (value: DropdownOption) => void;
    }
);

const InputDropdown = ({ options, width, ref, selected = 0, onChange }: DropdownProps) => {
    const { dropdownRef, open, targetRef, setOpen } = useDropdown();
    const [ optionIndex, setOptionIndex ] = useState(selected);

    const realWidth = typeof width === "number" ? `${width}px` : width === "full" ? "100%" : "auto";

    useImperativeHandle(ref, () => {
        return {
            selectedOption: options[optionIndex],
            setValue(value: string) {
                const newIndex = options.findIndex((option) => option.value === value);
                setOptionIndex(newIndex);
                if (onChange && newIndex != optionIndex) {
                    onChange(options[newIndex]);
                }
            },
            index: optionIndex,
        };
    });

    return (
        <>
            <div className="flex w-full items-center" onClick={() => setOpen(!open)} ref={targetRef}>
                <p className="text-xl font-light w-full">{ options[optionIndex].display }</p>
                <div className="w-2 h-2 rotate-45 border-b-2 border-r-2 border-solid mr-2"></div>
            </div>
            { open && <div style={{
                width: realWidth,
            }} className="absolute border border-solid rounded-md bg-white left-0 z-50" ref={dropdownRef}>
                {
                    options && options.map((option, index) => {
                        return (
                            <div key={index} className={`w-full h-auto p-1 not-last:border-b ${ index === optionIndex ? "bg-[#F5F5F5]" : "hover:bg-[#F5F5F5] cursor-pointer" }`} onMouseDown={() => {
                                setOptionIndex(index);
                                setOpen(false);
                                if (onChange) {
                                    onChange(options[index]);
                                }
                            }}>
                                { option.display }
                            </div>
                        );
                    })
                }
            </div> }
        </>
    );
};

const InputText = ({ type, placeholder = "", value, ref, onChange }: InputTextProps) => {

    const [ inputValue, setInputValue ] = useState("");

    useEffect(() => {
        if (value) {
            setInputValue(value);
        }
    }, [ value ]);

    return (
        <input type={type} placeholder={placeholder} ref={ref} defaultValue={inputValue} onChange={(e) => { 
            setInputValue(e.target.value);
            if(onChange) { 
                onChange(inputValue); 
            }
        }} className="border-none outline-none bg-inherit w-full" />
    );
};

export const Input = (props: InputProps) => {
    const id = useId();
    const realWidth = typeof props.width === "number" ? `${props.width}px` : props.width === "full" ? "100%" : "auto";

    return (
        <div style={{
            width: realWidth,
        }} id={id}>
            <div className="rounded-md p-2 bg-[#F5F5F5] border border-solid border-[#9A9A9A]">
                <p className="relative w-full h-auto text-[8px] text-black tracking-wider font-bold">{ props.label }</p>
                {
                    (() => {
                        switch(props.type) {
                            case "text":
                            case "password":
                                return (
                                    <InputText
                                        type={props.type}
                                        ref={props.ref}
                                        placeholder={props.placeholder}
                                        value={props.value}
                                        onChange={props.onChange}
                                    />
                                );
                            case "dropdown":
                                return (
                                    <InputDropdown
                                        options={props.options}
                                        width={props.width}
                                        ref={props.ref}
                                        selected={props.selected}
                                        onChange={props.onChange}
                                    />
                                );
                        }
                    })()
                }
            </div>
        </div>
    );
};