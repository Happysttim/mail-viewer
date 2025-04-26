import React from "react";

export const TablePageFallback = () => {
    return (
        <div role="status" className="min-w-[800px] w-full m-auto animate-pulse flex flex-col">
            <div className="h-12 w-[500px] bg-gray-200 rounded-md dark:bg-gray-400 mb-4"></div>
            <div className="h-[560px] w-full bg-gray-200 rounded-md dark:bg-gray-400"></div>
        </div>
    );
};