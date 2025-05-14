import { ReactNode, useEffect, useState } from "react";

type PromiseFallbackProp<T> = {
    fallback: ReactNode;
    children: (data?: T) => ReactNode;
    promise: Promise<T>;
};

export const PromiseFallback = <T,>({ fallback, children, promise }: PromiseFallbackProp<T>) => {
    const [ ipcData, setIpcData ] = useState<T | "none">("none");
    
    useEffect(() => {
        promise.then((data) => setIpcData(data));
    }, [ promise ]);

    return (
        ipcData !== "none" ? children(ipcData) : fallback
    );
};