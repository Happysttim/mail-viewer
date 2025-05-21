import React, { RefObject, Suspense, useEffect, useRef, useState } from "react";
import { Panel } from "./components/Panel";
import { StreamList } from "./components/StreamList";
import { StreamItem } from "./components/StreamItem";
import { TitleBar } from "../common/TitleBar";
import { IconButton } from "./components/IconButton";
import { PanelItem } from "./components/PanelItem";
import { Screen } from "./components/Screen";
import { Content } from "./components/Content";
import { TablePageFallback } from "./components/TablePageFallback";
import { CheckBoxTable } from "./components/CheckBoxTable";
import { EachCheckboxTr } from "./components/EachCheckboxTr";
import { Td } from "./components/Td";
import { format } from "date-fns";
import { Pagenation } from "./components/Pagenation";
import { MailDTO, StreamDTO } from "lib/database/dto";
import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import { Processing } from "../common/components/Processing";
import { MailFilter, MapParameter } from "app/type";
import { InvokeMap, StreamExtend } from "app/preload";
import { Limit } from "./components/Limit";
import { SeenMailIcon } from "./icons/SeenMailIcon";
import { UnseenMailIcon } from "./icons/UnseenMailIcon";
import { MagnifierIcon } from "./icons/MagnifierIcon";
import { NewAccountIcon } from "./icons/NewAccountIcon";
import { LogoutIcon } from "./icons/LogoutIcon";
import { ReloadIcon } from "./icons/Reload";
import { SearchModal } from "./components/SearchModal";
import { Confirm, ConfirmRef } from "../common/components/Confirm";

type MailListType = "get-all-mails" | "get-mail-list-page" | "get-mail-list-filter";
type MailListTypeProps<K extends MailListType> = {
    type: K;
    props: MapParameter<InvokeMap, K>;
};
type MailListProps<K extends MailListType> = MapParameter<InvokeMap, K>;
type StreamProps = {
    items: StreamExtend[];
    setStreams: (v: StreamExtend[]) => void;
    setSelectedStream: (v: StreamExtend | undefined) => void;
    onClick: (v: StreamExtend) => void;
};

type MailTableProps<K extends MailListType> = {
    stream: StreamDTO,
    type: K;
    listProps: MailListProps<K>;
    items: MailDTO[];
    total: number;
    page: number;
    limit: number;
    update: number;
    setMails: (v: MailDTO[]) => void;
    setPage: (v: number) => void;
    setTotal: (v: number) => void;
    setUpdate: (v: number) => void;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        }
    }
});

const Stream = ({ items, setStreams, setSelectedStream, onClick }: StreamProps) => {
    const { data } = useSuspenseQuery({
        queryKey: ["stream-profile"],
        queryFn: () => window.ipcRenderer.invoke("get-all-streams"),
        retry: false,
    });
    
    useEffect(() => {
        setStreams(data ?? []);
    }, [ data ]);

    return (
        <StreamList 
            items={items} 
            onClick={onClick}>
                {
                    (v, selected) => 
                        <StreamItem 
                            item={v.stream}
                            defaultName={v.stream.defaultName} 
                            profileColor={v.stream.profileColor} 
                            aliasName={v.stream.aliasName}
                            badge={
                                v.isError ? "ERROR" :
                                v.stream.notificate && v.stream.isNew ? "NOTIFICATE" : "NORMAL"
                            }
                            selected={selected}
                            onDelete={(item) => {
                                setStreams(items.filter((value) => value.stream.streamId != item.streamId));
                                setSelectedStream(undefined);
                            }}
                            />
                }
        </StreamList>
    );
};

const MailTable = <K extends MailListType>({ stream, type, listProps, items, total, page, limit, update, setMails, setPage, setUpdate }: MailTableProps<K>) => {
    const [ checkedAll, setCheckedAll ] = useState(false);
    const [ checkedRange, setCheckedRange ] = useState<string[]>([]);
    const confirmRef = useRef<ConfirmRef>(null);
    const { data } = useSuspenseQuery({
        queryKey: [type, listProps, update],
        queryFn: async () => {
            return await window.ipcRenderer.invoke(type, ...listProps);
        },
        select: (data) => data as MailDTO[],
        retry: false,
    });

    useEffect(() => {
        setMails(data ?? []);
        setCheckedAll(false);
        setCheckedRange([]);
    }, [ data ]);

    const handleRead = async (item: StreamDTO) => {
        if (checkedRange.length > 0 && await window.ipcRenderer.invoke("read-range-mails", item, checkedRange)) {
            setUpdate(Date.now());
        }
    };

    const handleRemove = async (item: StreamDTO) => {
        if (await window.ipcRenderer.invoke("delete-range-mails", item, checkedRange)) {
            setUpdate(Date.now());
        }

        confirmRef.current?.close();
    };

    const handleChange = async (checked: boolean, data: MailDTO) => {
        setCheckedRange(
            (prev) => {
                const compareId = stream.protocol === "imap" ? data.uid : data.fetchId.toString();
                const find = prev.find((value) => value === compareId);
                if (checked && find === undefined) {
                    prev.push(compareId);
                    return [...prev];
                } else if (!checked) {
                    return prev.filter((value) => value != compareId);
                }

                return prev;
            }
        );
    };

    useEffect(() => {
        if (checkedRange.length > 0) {
            console.log(checkedRange);
        }
    }, [ checkedRange ]);

    return (
        <>
            {
                checkedRange.length > 0 ?
                <Confirm title="메일을 삭제하시겠습니까?" ref={confirmRef} onClickYes={() => handleRemove(stream)} onClickCancel={() => confirmRef.current?.close()}>
                {
                    <p>정말 { checkedRange.length } 개의 메일을 삭제하시겠습니까?</p>
                }
                </Confirm> :
                <Confirm title="오류" ref={confirmRef} onClickYes={() => confirmRef.current?.close()}>
                {
                    <p>1개 이상의 메일을 선택해야 합니다.</p>
                }
                </Confirm>
            }
            <div className="w-full flex p-2 mt-2 items-center">
                <input type="checkbox" checked={checkedAll} onChange={() => setCheckedAll(!checkedAll)} className="w-4 h-4 mr-7 rounded-sm" />
                <button className="p-1 pr-3 pl-3 bg-white rounded-md hover:bg-gray-200 flex items-center mr-4" onClick={() => handleRead(stream)}>읽기</button>
                <button className="p-1 pr-3 pl-3 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center mr-4" onClick={() => {
                    if (confirmRef.current && !confirmRef.current.isOpen) {
                        console.log(checkedRange.length);
                        confirmRef.current.open();
                    }
                }}>삭제</button>
            </div>
            <CheckBoxTable bind={items} checked={checkedAll}>
                {
                    (checked, data) => {
                        return (
                            <EachCheckboxTr key={data.mailId} data={data} checked={checked} onChange={(checked) => handleChange(checked, data)} height={50}>
                            {
                                (data) => {
                                    const confirmedFont = data.isSeen ? "font-light" : "font-bold";
                                    const confirmedColor = data.isSeen ? "text-[#646464]" : "text-[#000000]";
                                    const from = data.fromAddress.match(/(.+)(?=\<.+?@.+?\..+?\>)/i) ?? ["", data.fromAddress];

                                    return (
                                        <>
                                            <Td icon={data.isSeen ? <SeenMailIcon /> : <UnseenMailIcon />} className="flex items-center justify-center h-full w-8 mr-2" />
                                            <Td label={from[1].replaceAll("\"", "")} tooltip={data.fromAddress} className={`w-[150px] overflow-hidden whitespace-nowrap text-ellipsis shrink-0 mr-4 text-sm ${confirmedFont} ${confirmedColor} hover:underline hover:cursor-pointer`} />
                                            <div className="flex flex-1">
                                                <Td label={data.subject} onClick={() => window.ipcRenderer.request("request-mailview", data)} tooltip={data.subject} className={`mr-1 text-sm line-clamp-2 text-clip ${confirmedFont} ${confirmedColor} hover:underline hover:cursor-pointer`} />
                                                <Td icon={<MagnifierIcon width={10} height={8} />} className="flex h-full w-8 mr-2 cursor-pointer" />
                                            </div>
                                            <Td label={format(data.date, "MM-dd HH:mm:ss")} className={`w-[120px] shrink-0 text-sm font-light ${confirmedColor}`} />
                                        </>
                                    );
                                }
                            }
                            </EachCheckboxTr>
                        );
                    }
                }
            </CheckBoxTable>
            <Pagenation showChunk={5} total={Math.ceil(total / limit)} current={page} onPageChange={(page) => setPage(page)} onNextChunk={() => setPage(page + 5 > Math.ceil(total / limit) ? Math.ceil(total / limit) : page + 5)} onPrevChunk={() => setPage(page - 5 <= 0 ? 1 : page - 5)} />
        </>
    );
};

export const App = () => {
    const [ page, setPage ] = useState(1);
    const [ total, setTotal ] = useState(0);
    const [ limit, setLimit ] = useState(10);
    const [ update, setUpdate ] = useState(0);
    const [ unseenMails, setUnseenMails ] = useState(0);
    const [ streams, setStreams ] = useState<StreamExtend[]>([]);
    const [ selectedStream, setSelectedStream ] = useState<StreamExtend | undefined>(undefined);
    const [ mailFilter, setMailFilter ] = useState<MailFilter>();
    const [ mails, setMails ] = useState<MailDTO[]>([]);
    const [ mailListProps, setMailListProps ] = useState<MailListTypeProps<MailListType>>();

    const [ modalOpen, setModalOpen ] = useState(false);

    useEffect(() => {
        window.ipcRenderer.on("update-stream", (_, extend: StreamExtend) => {
            setStreams((prev) => {
                const index = prev.findIndex((v) => v.stream.streamId === extend.stream.streamId);
                if (index !== -1) {
                    prev[index] = extend;
                } else {
                    prev.push(extend);
                }
                return [ ...prev ];
            });
        });

        window.ipcRenderer.on("get-unseen-mails", (_, unseen: number) => {
            setUnseenMails(unseen);
        });

        window.ipcRenderer.on("get-total-mails", (_, total: number) => {
            setTotal(total);
        });

        window.ipcRenderer.on("update-mail", (_) => {
            setUpdate(Date.now());
        });
    }, []);

    useEffect(() => {
        if (selectedStream) {
            const type = mailFilter ? "get-mail-list-filter" : "get-mail-list-page";
            setMailListProps({
                type,
                props: [ selectedStream.stream.streamId, page, limit, mailFilter ],
            });
        }
    }, [ selectedStream, limit, mailFilter, page ]);

    const handleAddStream = () => {
        window.ipcRenderer.request("request-stream", undefined);
    };

    const handleLogout = () => {
        window.ipcRenderer.request("request-logout", undefined);
    };

    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar backgroundColor="#020202" symbols={["MINIMUM", "MAXIMUM", "CLOSE"]} />
            <Screen>
                <Panel>
                    <PanelItem>
                        <IconButton label="새 계정 추가" onClick={handleAddStream} icon={<NewAccountIcon />} className="pl-[9px] lg:pl-0 items-center justify-center flex w-full h-full" />
                    </PanelItem>
                    <PanelItem divider={true}>
                        <QueryClientProvider client={queryClient}>
                            <Suspense fallback={
                                <div className="flex justify-center items-center">
                                    <Processing width={50} height={50} stroke="darkgray"/>
                                </div>
                            }>
                                <Stream setSelectedStream={setSelectedStream} items={streams} setStreams={setStreams} onClick={(v) => setSelectedStream(v)} />
                            </Suspense>
                        </QueryClientProvider>
                    </PanelItem>
                    <PanelItem bottomPosition={true}>
                        <IconButton label="로그아웃" onClick={handleLogout} icon={<LogoutIcon />} className="pl-[9px] lg:pl-0 items-center justify-center flex w-full h-full" />
                    </PanelItem>
                </Panel>
                <Content>
                    {
                        modalOpen && 
                        <SearchModal 
                            onCancel={() => setModalOpen(false)}
                            onSubmit={(filter) => {
                                setMailFilter(filter);
                                setModalOpen(false);
                            }}
                            defaultFilter={mailFilter} />
                    }
                    {
                        selectedStream && mailListProps ? (
                            <QueryClientProvider client={queryClient}>
                                <div className="w-full flex">
                                    <h1 className="text-3xl h-8 mr-4">확인안한 메일 { unseenMails }건</h1>
                                    <button 
                                        className="pr-4 pl-4 p-2 border border-gray-500 bg-white rounded-md hover:bg-gray-200 flex items-center mr-4" 
                                        onClick={() => setModalOpen(true)}>
                                        <span className="mr-1">검색</span>
                                        <MagnifierIcon 
                                            width={15}
                                            height={20}
                                    />
                                    </button>
                                    <button 
                                        className="p-2 border border-gray-500 bg-white rounded-md hover:bg-gray-200 mr-4 flex items-center" 
                                        onClick={() => setUpdate(Date.now())}>
                                        <ReloadIcon
                                            width={20}
                                            height={20}
                                            />
                                    </button>
                                    <div className="ml-auto">
                                        <Limit limitOptions={[10, 20, 30, 40, 50]} value={limit} onChange={(value) => setLimit(value)} />
                                    </div>
                                </div>
                                <Suspense fallback={<TablePageFallback />}>
                                    <MailTable
                                        stream={selectedStream.stream}
                                        type={mailListProps.type}
                                        listProps={mailListProps.props}
                                        items={mails}
                                        total={total}
                                        page={page}
                                        limit={limit}
                                        update={update}
                                        setMails={setMails}
                                        setPage={setPage}
                                        setTotal={setTotal}
                                        setUpdate={setUpdate}
                                    />
                                </Suspense>
                            </QueryClientProvider>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full">
                                <h1 className="text-3xl h-8">프로필을 선택해주세요</h1>
                                <p className="text-sm text-[#646464]">메일을 확인하기 위해서는 프로필을 선택해야합니다.</p>
                            </div>
                        )
                    }
                </Content>
            </Screen>
        </div>
    );
};