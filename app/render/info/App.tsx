import React, { useEffect, useRef, useState } from "react";
import { TitleBar } from "../common/TitleBar";
import { DropdownRef, Input } from "./components/Input";
import { Checkbox, CheckboxRef } from "./components/Checkbox";
import { Avatar } from "./components/Avatar";
import { Button } from "./components/Button";
import { Validate, ValidateRef } from "../common/components/Validate";
import { StreamDTO } from "lib/database/dto";

export const App = () => {
    const [ color, setColor ] = useState("#000000");
    const [ streamMemory, setStreamMemory ] = useState<StreamDTO>();
    const [ isFail, setIsFail ] = useState(false);

    const dropdownRef = useRef<DropdownRef>(null);
    const addressRef = useRef<HTMLInputElement>(null);
    const portRef = useRef<HTMLInputElement>(null);
    const mailIdRef = useRef<HTMLInputElement>(null);
    const aliasNameRef = useRef<HTMLInputElement>(null);
    const mailPasswordRef = useRef<HTMLInputElement>(null);
    const sslRef = useRef<CheckboxRef>(null);
    const notificateRef = useRef<CheckboxRef>(null);

    const addressValidateRef = useRef<ValidateRef>(null);
    const portValidateRef = useRef<ValidateRef>(null);
    const mailIdValidateRef = useRef<ValidateRef>(null);
    const mailPasswordValidateRef = useRef<ValidateRef>(null);

    useEffect(() => {
        window.ipcRenderer.once("request-stream", (_, streamDto) => {
            if (!streamDto) {
                return;
            }

            setStreamMemory(streamDto);
            setColor(streamDto.profileColor);
            if (dropdownRef.current && sslRef.current && notificateRef.current && addressRef.current && portRef.current && mailIdRef.current && aliasNameRef.current && mailPasswordRef.current) {
                dropdownRef.current.setValue(streamDto.protocol);
                sslRef.current.setValue(streamDto.tls);
                notificateRef.current.setValue(streamDto.notificate);
                addressRef.current.value = streamDto.host;
                portRef.current.value = streamDto.port.toString();
                mailIdRef.current.value = streamDto.mailId;
                aliasNameRef.current.value = streamDto.aliasName;
                mailPasswordRef.current!.value = streamDto.mailPassword;
            }        
        });
    }, []);

    const handleSave = async () => {
        if (
            dropdownRef.current && addressRef.current && 
            portRef.current && mailIdRef.current && 
            aliasNameRef.current && mailPasswordRef.current &&
            addressValidateRef.current && portValidateRef.current &&
            mailIdValidateRef.current && mailPasswordValidateRef.current &&
            sslRef.current && notificateRef.current
        ) {
            const addressValidate = addressValidateRef.current.validate();
            const portValidate = portValidateRef.current.validate();
            const mailIdValidate = mailIdValidateRef.current.validate();
            const mailPasswordValidate = mailPasswordValidateRef.current.validate();

            if (addressValidate && portValidate && mailIdValidate && mailPasswordValidate) {
                if (!streamMemory) {
                    const streamDto = await window.ipcRenderer.invoke(
                        "insert-mail-address", 
                        mailIdRef.current.value, 
                        mailPasswordRef.current.value, 
                        dropdownRef.current.value.value, 
                        addressRef.current.value, 
                        parseInt(portRef.current.value), 
                        sslRef.current.value,
                        mailIdRef.current.value, 
                        aliasNameRef.current.value, 
                        color, 
                        notificateRef.current.value,
                    );

                    if (!streamDto) {
                        setIsFail(true);
                        return;
                    }

                    window.ipcRenderer.request("request-win-control", "CLOSE");
                } else {
                    const streamDto: StreamDTO = {
                        streamId: streamMemory.streamId,
                        mailId: mailIdRef.current.value,
                        mailPassword: mailPasswordRef.current.value,
                        protocol: dropdownRef.current.value.value,
                        host: addressRef.current.value,
                        port: parseInt(portRef.current.value),
                        tls: sslRef.current.value,
                        defaultName: mailIdRef.current.value,
                        aliasName: aliasNameRef.current.value,
                        profileColor: color,
                        notificate: notificateRef.current.value,
                        isNew: streamMemory.isNew,
                    };

                    const result = await window.ipcRenderer.invoke("update-mail-address", streamDto);
                    if (!result) {
                        setIsFail(true);
                        return;
                    }
                    window.ipcRenderer.request("request-win-control", "CLOSE");
                }
            }
        }
    };

    const handleCancel = () => {
        window.ipcRenderer.request("request-win-control", "CLOSE");
    };

    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar backgroundColor="#020202" symbols={["MINIMUM", "CLOSE"]} />
            <div className="info-form">
                <div className="form-control">
                    <div className="flex items-center">
                        <div className="mr-2">
                            <Input type="dropdown" label="프로토콜" width={200} ref={dropdownRef} options={
                                [
                                    { display: "POP3", value: "pop3" },
                                    { display: "IMAP", value: "imap" },
                                ]
                            } />
                        </div>
                        <Checkbox label="SSL 사용" ref={sslRef} />
                        <Checkbox label="새 메일 알림" ref={notificateRef} />
                    </div>
                </div>
                <div className="form-control">
                    <Input type="text" label="서버 주소" ref={addressRef} width={350} placeholder="ex) pop.naver.com" />
                    <Input type="text" label="서버 포트" ref={portRef} width={150} placeholder="995" />
                </div>
                <div className="form-control">
                    <Validate className="text-sm text-red-600" causes={
                        {
                            required: "메일 서버 주소를 입력해야 합니다.",
                            fail: "메일 등록을 실패했습니다.",
                        }
                    } ref={addressValidateRef} isFail={isFail} validateRef={addressRef} />
                    <Validate className="text-sm text-red-600" causes={
                        {
                            required: "메일 서버의 포트를 입력해야 합니다.",
                            numeric: "메일 서버의 포트는 숫자여야 합니다.",
                        }
                    } ref={portValidateRef} validateRef={portRef} />
                </div>
                <div className="form-control mt-4">
                    <div className="flex flex-col w-[350px]">
                        <div className="mb-5">
                            <Input type="text" ref={mailIdRef} label="메일계정" width="full" placeholder="당신의 메일 아이디를 입력하세요." />
                            <Validate className="text-sm text-red-600" causes={
                                {
                                    required: "메일 계정을 입력해야 합니다.",
                                }
                            } ref={mailIdValidateRef} validateRef={mailIdRef} />
                        </div>
                        <div className="mb-5">
                            <Input type="text" label="별명" width="full" ref={aliasNameRef} placeholder="구분하기 쉬운 별명을 입력해주세요." />
                        </div>
                        <div className="mb-5">
                            <Input type="password" ref={mailPasswordRef} label="비밀번호" width="full" placeholder="당신의 메일 비밀번호를 입력하세요." />
                            <Validate className="text-sm text-red-600" causes={
                                {
                                    required: "메일 계정의 비밀번호를 입력해야 합니다.",
                                }
                            } ref={mailPasswordValidateRef} validateRef={mailPasswordRef} />
                        </div>
                    </div>
                    <Avatar color={color} onChange={setColor} />
                </div>
                <div className="form-control mt-6">
                    <div className="flex w-full items-center">
                        <Button type="YES" text="저장" onClick={handleSave} />
                        <Button type="NO" text="취소" onClick={handleCancel} />
                    </div>
                </div>
            </div>
        </div>
    );
};