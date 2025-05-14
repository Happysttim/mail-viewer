import React, { Suspense, useEffect, useState } from "react";
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
import { MailFilterMap, MapParameter } from "app/type";
import { InvokeMap, StreamExtend } from "app/preload";
import { Limit } from "./components/Limit";

type MailListType = "get-all-mails" | "get-mail-list-page" | "get-mail-list-filter";
type MailListTypeProps<K extends MailListType> = {
    type: K;
    props: MapParameter<InvokeMap, K>;
};
type MailListProps<K extends MailListType> = MapParameter<InvokeMap, K>;
type StreamProps = {
    items: StreamExtend[];
    setStreams: (v: StreamExtend[]) => void;
    onClick: (v: StreamExtend) => void;
};

type MailTableProps<K extends MailListType> = {
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
    onClick: (v: MailDTO) => void;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        }
    }
});

const LogoutIcon = () => {
    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" rx="5" fill="#646464"/>
            <path d="M25.7071 16.2071C26.0976 15.8166 26.0976 15.1834 25.7071 14.7929L19.3431 8.42893C18.9526 8.03841 18.3194 8.03841 17.9289 8.42893C17.5384 8.81946 17.5384 9.45262 17.9289 9.84315L23.5858 15.5L17.9289 21.1569C17.5384 21.5474 17.5384 22.1805 17.9289 22.5711C18.3194 22.9616 18.9526 22.9616 19.3431 22.5711L25.7071 16.2071ZM12.1428 16.5H25V14.5H12.1428V16.5Z" fill="#9E9E9E"/>
            <mask id="path-3-inside-1_531_119" fill="white">
                <path d="M5 3H17.1429V28H5V3Z"/>
            </mask>
            <path d="M5 3V1H3V3H5ZM5 28H3V30H5V28ZM5 5H17.1429V1H5V5ZM17.1429 26H5V30H17.1429V26ZM7 28V3H3V28H7Z" fill="#9E9E9E" mask="url(#path-3-inside-1_531_119)"/>
        </svg>
    );
};

const NewAccountIcon = () => {
    return(
        <svg xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30">
            <path d="M5,15 h20 M15,5 v20z" stroke="#B0B0B0" strokeWidth="1" />    
        </svg>
    );
};

const UnconfirmedMailIcon = () => {
    return (
        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.25 0.589682L7.85101 8.19069L8.02779 8.36747L8.20456 8.19069L15.75 0.645257V14.7919H0.25V0.589682ZM0.659307 0.291882H15.3963L8.02779 7.66036L0.659307 0.291882Z" fill="#A7D4FF" stroke="white" strokeWidth="0.5"/>
        </svg>
    );
};

const ConfirmedMailIcon = () => {
    return (
        <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.25" y="5.47913" width="15.5" height="9.27084" fill="#D9D9D9" stroke="#A1A1A1" strokeWidth="0.5"/>
            <rect x="0.418956" width="9.01441" height="9.08069" transform="matrix(0.837911 -0.545806 0.837911 0.545806 0.067908 5.42178)" fill="#D9D9D9" stroke="#A1A1A1" strokeWidth="0.5"/>
        </svg>

    );
};

const MagnifierIcon = () => {
    return (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.3505 3.29839C6.3505 4.82627 5.05877 6.09677 3.42525 6.09677C1.79172 6.09677 0.5 4.82627 0.5 3.29839C0.5 1.7705 1.79172 0.5 3.42525 0.5C5.05877 0.5 6.3505 1.7705 6.3505 3.29839Z" stroke="#3C3C3C"/>
            <line y1="-0.5" x2="4.05157" y2="-0.5" transform="matrix(0.792188 0.610278 -0.63902 0.76919 5.48041 5.27734)" stroke="#3C3C3C"/>
        </svg>
    );
};

const Stream = ({ items, setStreams, onClick }: StreamProps) => {
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
                            selected={selected} />
                }
        </StreamList>
    );
};

const MailTable = <K extends MailListType>({ type, listProps, items, total, page, limit, update, setTotal, setMails, setPage, onClick }: MailTableProps<K>) => {
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
    }, [ data ]);

    return (
        <>
            <CheckBoxTable bind={items} checked={false}>
                {
                    (checked, data) => {
                        return (
                            <EachCheckboxTr key={data.mailId} data={data} checked={checked} onChange={() => console.log(data)} height={50}>
                            {
                                (data) => {
                                    const confirmedFont = data.isSeen ? "font-light" : "font-bold";
                                    const confirmedColor = data.isSeen ? "text-[#646464]" : "text-[#000000]";
                                    const from = data.fromAddress.match(/(.+)(?=\<.+?@.+?\..+?\>)/i) ?? ["", data.fromAddress];

                                    return (
                                        <>
                                            <Td icon={data.isSeen ? <ConfirmedMailIcon /> : <UnconfirmedMailIcon />} className="flex items-center justify-center h-full w-8 mr-2" />
                                            <Td label={from[1].replaceAll("\"", "")} tooltip={data.fromAddress} className={`w-[150px] overflow-hidden whitespace-nowrap text-ellipsis shrink-0 mr-4 text-sm ${confirmedFont} ${confirmedColor} hover:underline hover:cursor-pointer`} />
                                            <div className="flex flex-1">
                                                <Td label={data.subject} tooltip={data.subject} className={`mr-1 text-sm line-clamp-2 text-clip ${confirmedFont} ${confirmedColor} hover:underline hover:cursor-pointer`} />
                                                <Td icon={<MagnifierIcon />} className="flex h-full w-8 mr-2 cursor-pointer" />
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
    const [ mailFilter, setMailFilter ] = useState<MailFilterMap>();
    const [ mails, setMails ] = useState<MailDTO[]>([]);
    const [ mailListProps, setMailListProps ] = useState<MailListTypeProps<MailListType>>();

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
                                <Stream items={streams} setStreams={setStreams} onClick={(v) => setSelectedStream(v)} />
                            </Suspense>
                        </QueryClientProvider>
                    </PanelItem>
                    <PanelItem bottomPosition={true}>
                        <IconButton label="로그아웃" onClick={handleLogout} icon={<LogoutIcon />} className="pl-[9px] lg:pl-0 items-center justify-center flex w-full h-full" />
                    </PanelItem>
                </Panel>
                <Content>
                    {
                        selectedStream && mailListProps ? (
                            <QueryClientProvider client={queryClient}>
                                <div className="w-full flex">
                                    <h1 className="text-3xl h-8 mr-4">확인안한 메일 { unseenMails }건</h1>
                                    <button className="p-2 border border-gray-500 bg-white rounded-md target:bg-gray-500" onClick={() => setUpdate(Date.now())}>새로고침</button>
                                    <div className="float-right">
                                        <Limit limitOptions={[10, 20, 30, 40, 50]} value={limit} onChange={(value) => setLimit(value)} />
                                    </div>
                                </div>
                                <Suspense fallback={<TablePageFallback />}>
                                    <MailTable
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
                                        onClick={(v) => console.log(v)}
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