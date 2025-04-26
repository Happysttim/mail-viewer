import React, { Suspense, useState } from "react";
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

export const App = () => {
    const [ page, setPage ] = useState(1);
    const [ total, setTotal ] = useState(100);
    const dummyAccounts = [
        {
            defaultName: "gmlsdyd1023@naver.com",
            profileColor: "#d2d2d2",
            notificate: false,
            selected: false,
        },
        {
            defaultName: "rjadmsdyd1023@naver.com",
            aliasName: "업무용 메일함",
            profileColor: "#8ccccc",
            notificate: true,
            selected: false,
        },
        {
            defaultName: "happysttim1023@gmail.com",
            profileColor: "#c82d32",
            notificate: false,
            selected: false,
        },
    ];

    const dummyMails = [
        {
            mailId: 1,
            streamId: "StreamID1",
            uid: "UID1",
            isSeen: false,
            date: "2025-04-09 10:00:00",
            fromAddress: "from@naver.com",
            subject: "메일 제목 1",
        },
        {
            mailId: 2,
            streamId: "StreamID1",
            uid: "UID2",
            isSeen: false,
            date: "2025-03-09 11:01:11",
            fromAddress: "from@kakao.com",
            subject: "Hello world",
        },
        {
            mailId: 3,
            streamId: "StreamID1",
            uid: "UID3",
            isSeen: true,
            date: "2025-04-07 23:10:52",
            fromAddress: "from@gmail.com",
            subject: "대충 메일 제목이 길어서 뭐라고 적어야 할지 모르겠지만 아무튼 너무 길다. 대충 메일 제목이 길어서 뭐라고 적어야 할지 모르겠지만 아무튼 너무 길다. 대충 메일 제목이 길어서 뭐라고 적어야 할지 모르겠지만 아무튼 너무 길다. 대충 메일 제목이 길어서 뭐라고 적어야 할지 모르겠지만 아무튼 너무 길다. 이걸 어떻게 적어야할지 모르겠지만 나는 IDE의 여백이 부족해질때까지 계속해서 적어야 한다. 그것이 나의 숙명 ㅇㅇ",
        },
    ];

    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar backgroundColor="#020202" symbols={["MINIMUM", "MAXIMUM", "CLOSE"]} />
            <Screen>
                <Panel>
                    <PanelItem>
                        <IconButton label="새 계정 추가" icon={<NewAccountIcon />} className="pl-[9px] lg:pl-0 items-center justify-center flex w-full h-full" />
                    </PanelItem>
                    <PanelItem divider={true}>
                        <StreamList 
                            items={dummyAccounts} 
                            onClick={(v) => console.log(v)}
                            renderItem={(v, selected) => 
                                <StreamItem 
                                    defaultName={v.defaultName} 
                                    profileColor={v.profileColor} 
                                    aliasName={v.aliasName}
                                    notificate={v.notificate}
                                    selected={selected} />}
                        />
                    </PanelItem>
                    <PanelItem bottomPosition={true}>
                        <IconButton label="로그아웃" icon={<LogoutIcon />} className="pl-[9px] lg:pl-0 items-center justify-center flex w-full h-full" />
                    </PanelItem>
                </Panel>
                <Content>
                    <Suspense fallback={<TablePageFallback />}>
                        <h1 className="text-3xl h-8">확인안한 메일 {  }</h1>
                        <CheckBoxTable bind={dummyMails} checked={false}>
                            {
                                (checked, data) => {
                                    return (
                                        <EachCheckboxTr key={data.mailId} data={data} checked={checked} onChange={() => console.log(data)} height={50}>
                                        {
                                            (data) => {
                                                const comfirmedFont = data.isSeen ? "font-light" : "font-bold";
                                                const comfirmedColor = data.isSeen ? "text-[#646464]" : "text-[#000000]";

                                                return (
                                                    <>
                                                        <Td icon={data.isSeen ? <ConfirmedMailIcon /> : <UnconfirmedMailIcon />} className="flex items-center justify-center h-full w-8 mr-2" />
                                                        <Td label={data.fromAddress} className={`w-[150px] shrink-0 mr-4 text-sm ${comfirmedFont} ${comfirmedColor} hover:underline hover:cursor-pointer`} />
                                                        <div className="flex flex-1">
                                                            <Td label={data.subject} className={`mr-1 text-sm line-clamp-2 text-clip ${comfirmedFont} ${comfirmedColor} hover:underline hover:cursor-pointer`} />
                                                            <Td icon={<MagnifierIcon />} className="flex h-full w-8 mr-2 cursor-pointer" />
                                                        </div>
                                                        <Td label={format(data.date, "MM-dd HH:mm:ss")} className={`w-[120px] shrink-0 text-sm font-light ${comfirmedColor}`} />
                                                    </>
                                                );
                                            }
                                        }
                                        </EachCheckboxTr>
                                    );
                                }
                            }
                        </CheckBoxTable>
                        <Pagenation ref={null} showChunk={5} total={total} current={page} onPageChange={(page) => setPage(page)} onNextChunk={() => setPage(page + 5)} onPrevChunk={() => setPage(page - 5 <= 0 ? 1 : page - 5)} />
                    </Suspense>
                </Content>
            </Screen>
        </div>
    );
};