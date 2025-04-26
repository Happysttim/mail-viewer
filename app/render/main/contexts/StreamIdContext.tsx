import { createContext, Dispatch, ReactNode, useState } from "react";

type StreamDispatch<T> = { streamId: T, dispatch: Dispatch<T> };
type ProviderProp = {
    children: ReactNode,
};
export const StreamIdContext = createContext<StreamDispatch<string>>({
    streamId: "",
    dispatch: () => "",
});
export const StreamIdProvider = ({ children }: ProviderProp) => {
    const [ streamId, dispatch ] = useState("");

    return (
        <StreamIdContext.Provider value={{streamId, dispatch}}>
            { children }
        </StreamIdContext.Provider>
    );
};