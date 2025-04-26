import React from "react";
import { TitleBar } from "../common/TitleBar";
import { Input } from "./components/Input";
import { Checkbox } from "./components/Checkbox";
import { Avatar } from "./components/Avatar";
import { Button } from "./components/Button";

export const App = () => {

    const dropdownOptions = [
        { display: "POP3", value: "pop3" },
        { display: "IMAP", value: "imap" },
    ];

    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar backgroundColor="#020202" symbols={["MINIMUM", "CLOSE"]} />
            <div className="info-form">
                <div className="form-control">
                    <div className="flex items-center">
                        <div className="mr-2">
                            <Input type="dropdown" label="프로토콜" width={200} options={dropdownOptions} onChange={console.log} />
                        </div>
                        <Checkbox label="SSL 사용" checked={false} onChange={console.log} />
                    </div>
                </div>
                <div className="form-control">
                    <Input type="text" label="서버 주소" width={350} placeholder="ex) pop3.naver.com" onChange={console.log} />
                    <Input type="text" label="서버 포트" width={150} placeholder="587" onChange={console.log} />
                </div>
                <div className="form-control mt-4">
                    <div className="flex flex-col w-[350px]">
                        <div className="mb-5">
                            <Input type="text" label="메일계정" width="full" placeholder="당신의 메일 아이디를 입력하세요." onChange={console.log} />
                        </div>
                        <div className="mb-5">
                            <Input type="text" label="별명" width="full" placeholder="구분하기 쉬운 별명을 입력해주세요." onChange={console.log} />
                        </div>
                        <div className="mb-5">
                            <Input type="text" label="비밀번호" width="full" placeholder="당신의 메일 비밀번호를 입력하세요." onChange={console.log} />
                        </div>
                    </div>
                    <Avatar color="#FF0000" onChange={console.log} />
                </div>
                <div className="form-control mt-6">
                    <div className="flex w-full items-center">
                        <Button type="YES" text="저장" onClick={console.log} />
                        <Button type="NO" text="취소" onClick={console.log} />
                    </div>
                </div>
            </div>
        </div>
    );
};