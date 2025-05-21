import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TitleBar } from "../common/TitleBar";
import { MailDTO, StreamDTO } from "lib/database/dto";
import { skipToken, useSuspenseQuery } from "@tanstack/react-query";
import { Processing } from "../common/components/Processing";
import { Overlay } from "../common/components/Overlay";
import { format } from "date-fns";
import { Mime } from "app/type";
import { Confirm, ConfirmRef } from "../common/components/Confirm";

const safeMimeArray = (mimes: Mime[] | typeof skipToken): mimes is Mime[] => {
    return typeof mimes === "object";
};

const downloadAttachment = (filename: string, content: string | Buffer<ArrayBuffer>) => {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const App = () => {
    
    const [ streamDto, setStreamDTO ] = useState<StreamDTO>();
    const [ mailDto, setMailDTO ] = useState<MailDTO>();
    const [ display, setDisplay ] = useState<string>("");
    const [ contentIdMap, setContentIdMap ] = useState<Map<string, string>>();
    const [ attaches, setAttaches ] = useState<Mime[]>();
    const [ done, setDone ] = useState(false);
    const confirmRef = useRef<ConfirmRef>(null);

    const divRef = useRef<HTMLDivElement>(null);

    const { data } = useSuspenseQuery({
        queryKey: [streamDto, mailDto],
        queryFn: async () => {
            if (streamDto && mailDto) {
                const result = await window.ipcRenderer.invoke("read-mail", streamDto, mailDto);
                if (!result) {
                    throw new Error("Result is undefined");
                }
                return result;
            } else {
                return skipToken;
            }
        },
        retry: true,
    });

    useEffect(() => {
        if (safeMimeArray(data)) {
            setDisplay(() => {
                const htmlMime = data.filter((value) => value.contentType.includes("text/html"));
                if (htmlMime.length === 0) {
                    return data.filter((value) => value.contentType.includes("text/plain")).map((value) => value.contentBody).join("");
                }

                return htmlMime.map((value) => value.contentBody).join("");
            });

            setAttaches(() => data.filter((value) => value.file).filter((value) => !value.file?.contentId));
            setContentIdMap(() => {
                const result = new Map();

                data.filter((value) => value.file).map((mime) => {
                    if (mime.file?.contentId) {
                        const cid = mime.file.contentId.replace(/[<>]/g, "");
                        result.set(cid, `data:${mime.contentType}${mime.contentTransferEncoding},${mime.contentBody}`);
                    }
                });

                return result;
            });
        }
    }, [ data ]);

    useEffect(() => {
        if (display != "" && contentIdMap) {
            contentIdMap.forEach((value, key) => {
                setDisplay((prev) => {
                    return prev.replace(`cid:${key}`, value);
                });
            });

            setDone(true);
        }
    }, [ display, contentIdMap ]);

    useEffect(() => {
        if (done) {
            if (divRef.current) {
                if (!divRef.current.shadowRoot) {
                    const shadow = divRef.current.attachShadow({ mode: "open" });
                    shadow.innerHTML = display;
                }
            }
        }
    }, [ done ]);

    useLayoutEffect(() => {
        window.ipcRenderer.once("request-mailview", (_, streamDto, mailDto) => {
            setStreamDTO(streamDto);
            setMailDTO(mailDto);
        });
    }, []);

    const handleRemove = async () => {
        if (streamDto && mailDto) {
            await window.ipcRenderer.invoke(
                "delete-mail", 
                streamDto, 
                streamDto.protocol === "imap" ? 
                mailDto.uid : mailDto.fetchId.toString()
            );

            window.ipcRenderer.request("request-close-mailview", undefined);
        }
    };
    
    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar backgroundColor="#020202" symbols={["MINIMUM", "MAXIMUM", "CLOSE"]} />
            <div className="w-full p-2 border-b-2 border-b-black">
                <p className="font-semibold text-[32px] tracking-tighter">
                    { mailDto?.subject ?? "" }
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <p className="text-sm text-gray-600 mr-4 font-light">
                            { format(mailDto?.date ?? new Date(), "yyyy년 MM월 dd일 HH시 mm분 ss초") }
                        </p>
                        <p className="text-sm text-black font-bold tracking-tighter">
                            { mailDto?.fromAddress ?? "" }
                        </p>
                    </div>
                    <button className="p-1 pr-3 pl-3 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center mr-4" onClick={() => {
                        if (confirmRef.current && !confirmRef.current.isOpen) {
                            confirmRef.current.open();
                        }
                    }}>삭제</button>
                    <Confirm title="메일을 삭제하시겠습니까?" ref={confirmRef} onClickYes={handleRemove} onClickCancel={() => confirmRef.current?.close()}>
                        <p>정말 메일을 삭제하시겠습니까?</p>
                    </Confirm>
                </div>
                <div className="mt-2 mb-2 w-full flex items-center">
                    {
                        attaches && attaches.length > 0 ? (
                        <>
                            <span className="text-sm font-light text-black mr-2">첨부파일: </span>
                            {
                                attaches.map((mime, idx) => {
                                    return (
                                        <button key={idx} className="p-1 text-white bg-blue-400 border border-gray-200 rounded-md text-sm" onClick={() => downloadAttachment(
                                            mime.file?.filename || Date.now().toString(),
                                            mime.contentBody
                                        )}>
                                            { mime.file?.filename || `${idx}번 파일` }
                                        </button>
                                    );
                                })
                            }
                        </>
                        ) : (
                            <></>
                        )
                    }
                </div>
            </div>
            <Suspense fallback={
                <Overlay>
                    <div className="m-auto">
                        <Processing width={100} height={100} stroke="gray" />
                    </div>
                </Overlay>
            }>
                <div className="overflow-auto p-2" ref={divRef}></div>
            </Suspense>
        </div>
    );
};