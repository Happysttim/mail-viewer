import React, { CSSProperties, RefObject, useEffect, useImperativeHandle, useState } from "react";

type ValidateType = "required" | "fail" | "numeric";
export type ValidateRef = {
    validate: () => boolean;
    reset: () => void;
    success: boolean;
};

type ValidateProp<T> = {
    validateRef: RefObject<HTMLInputElement>;
    ref: RefObject<ValidateRef>;
    causes: Partial<Record<ValidateType, string>>;
    isFail?: boolean;
    className?: string;
    style?: CSSProperties;
};

export const Validate = <T,>({ validateRef, ref, causes, isFail, className, style }: ValidateProp<T>) => {

    const [ message, setMessage ] = useState("");
    const [ success, setSuccess ] = useState(false);

    useImperativeHandle(ref, () => {
        return {
            validate: () => {
                if (validateRef.current) {
                    if (causes.required && validateRef.current.value.trim() === "") {
                        setMessage(causes.required);
                        setSuccess(false);
                        return false;
                    }

                    if (causes.numeric && isNaN(Number(validateRef.current.value))) {
                        setMessage(causes.numeric);
                        setSuccess(false);
                        return false;
                    }

                    setMessage("");
                    setSuccess(true);
                    return true;
                }
                setSuccess(false);
                return false;
            },
            reset: () => {
                setMessage("");
                setSuccess(false);
            },
            success,
        };
    });

    useEffect(() => {
        if (validateRef.current) {
            if (causes.fail && isFail) {
                setMessage(causes.fail);
                setSuccess(false);
            }
        }
    }, [ isFail ]);

    return !success && message && (
        <span style={style} className={className}>{ message }</span>
    );
};