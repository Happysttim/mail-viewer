import { Processing } from "app/render/common/components/Processing";
import { PromiseFallback } from "app/render/common/components/PromiseFallback";
import { Validate, ValidateRef } from "app/render/common/components/Validate";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";

type EntryType = "LOGIN" | "REGISTER";
type FormProp = {
    idRequired: string;
    passwordRequired: string;
    submitFailed: string;
    submitText: string;
    ipcFail: boolean;
    idValidateRef: RefObject<ValidateRef>;
    passwordValidateRef: RefObject<ValidateRef>;
    idRef: RefObject<HTMLInputElement>;
    passwordRef: RefObject<HTMLInputElement>;
    onClick: () => void;
};

const Form = ({ idRequired, passwordRequired, submitFailed, submitText, ipcFail, idValidateRef, passwordValidateRef, idRef, passwordRef, onClick }: FormProp) => {
    return (
        <>
            <div className="mb-3">
                <input type="textbox" ref={idRef} className="input-textbox" placeholder="ID" />
                <Validate className="text-sm text-red-600" isFail={ipcFail} causes={{
                    required: idRequired,
                    fail: submitFailed,
                }} validateRef={idRef} ref={idValidateRef} />
            </div>
            <div className="mb-3">
                <input type="password" ref={passwordRef} className="input-textbox" placeholder="PASSWORD" />
                <Validate className="text-sm text-red-600" causes={{
                    required: passwordRequired,
                }} validateRef={passwordRef} ref={passwordValidateRef} />
            </div>
            <div className="mb-6">
                <button className="btn-lightAmber" onClick={onClick}>{ submitText }</button>
            </div>
        </>
    );
};

export const Entry = () => {
    const [ entryType, setEntryType ] = useState<EntryType>("LOGIN");
    const [ ipcReady, setIpcReady ] = useState(false);
    const [ user, setUser ] = useState({
        id: "",
        password: "",
    });

    const idRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const idValidateRef = useRef<ValidateRef>(null);
    const passwordValidateRef = useRef<ValidateRef>(null);
    const textMemo = useMemo(() => {
        return entryType === "REGISTER" ? [
            "지금 빠르게",
            "계정을 만들어보세요",
            "REGISTER",
            "로그인 화면으로 돌아가기",
        ] : [
            "당신의 모든 메일을",
            "여기서 확인해보세요",
            "L O G I N",
            "계정이 없으시다면 지금 만들어보세요!",
        ];
    }, [ entryType ]);
    const validateMemo = useMemo(() => {
        return entryType === "REGISTER" ? [
            "아이디를 입력해야 합니다.",
            "존재하는 아이디 입니다.",
            "비밀번호를 입력해야 합니다.",
        ] : [
            "아이디를 입력해야 합니다.",
            "아이디 또는 비밀번호가 잘못되었습니다.",
            "비밀번호를 입력해야 합니다.",
        ];
    }, [ entryType ]);
    const ipcMemo = useMemo(() => {
        if (!ipcReady) {
            return null;
        }
        if (entryType === "REGISTER") {
            return window.ipcRenderer.invoke("create-user-account", {
                id: user.id,
                password: user.password,
            });
        }

        if (entryType === "LOGIN") {
            return window.ipcRenderer.invoke("login-user-account", {
                id: user.id,
                password: user.password,
            });
        }
    }, [ ipcReady, user, entryType ]);

    useEffect(() => {
        if (idRef.current && passwordRef.current && idValidateRef.current && passwordValidateRef.current) {
            idRef.current.value = "";
            passwordRef.current.value = "";
            idValidateRef.current.reset();
            passwordValidateRef.current.reset();
        }
    }, [ entryType ]);

    const handleClick = async () => {
        if (idValidateRef.current && passwordValidateRef.current && idRef.current && passwordRef.current) {
            const idValidate = idValidateRef.current.validate();
            const passwordValidate = passwordValidateRef.current.validate();
            if (idValidate && passwordValidate) {
                setUser({
                    id: idRef.current.value.trim(),
                    password: passwordRef.current.value.trim(),
                });
                setIpcReady(true);
            }
        }
    };

    return (
        <>
            <div className="mt-28 ml-16">
                <p className="big-title text-white">{ textMemo[0] }</p>
                <p className="big-title text-white">{ textMemo[1] }</p>
            </div>
            <div className="w-60 h-full mt-52 mr-auto ml-auto">
                {
                    (ipcMemo && ipcReady && entryType === "REGISTER") ? (
                        <PromiseFallback
                            fallback={
                                <div className="flex justify-center items-center">
                                    <Processing width={50} height={50} stroke="darkgray"/>
                                </div>
                            }
                            promise={ipcMemo}>
                                {
                                    (result) => {
                                        return result ? (
                                            <div className="w-full">
                                                <p className="text-white text-sm tracking-tighter font-thin mb-2 text-center">회원가입이 완료되었습니다.</p>
                                                <p className="text-white text-sm tracking-tighter font-thin mb-2 text-center">로그인 창으로 돌아가서 로그인 해주세요!</p>
                                            </div>
                                        ) : (
                                            <Form
                                                idRequired={validateMemo[0]}
                                                submitFailed={validateMemo[1]}
                                                passwordRequired={validateMemo[2]}
                                                submitText={textMemo[2]}
                                                ipcFail={true}
                                                idValidateRef={idValidateRef}
                                                passwordValidateRef={passwordValidateRef}
                                                idRef={idRef}
                                                passwordRef={passwordRef}
                                                onClick={handleClick}
                                            />
                                        );
                                    }
                                }
                        </PromiseFallback>
                    ) :
                    (ipcMemo && ipcReady && entryType === "LOGIN") ? (
                        <PromiseFallback
                            fallback={
                                <div className="flex justify-center items-center">
                                    <Processing width={50} height={50} stroke="darkgray"/>
                                </div>
                            }
                            promise={ipcMemo}>
                                {
                                    (result) => {
                                        if (result) {
                                            window.ipcRenderer.request("request-main-login", {
                                                id: user.id,
                                                password: user.password,
                                            });

                                            return (<></>);
                                        } else {
                                            return (<Form
                                                idRequired={validateMemo[0]}
                                                submitFailed={validateMemo[1]}
                                                passwordRequired={validateMemo[2]}
                                                submitText={textMemo[2]}
                                                ipcFail={true}
                                                idValidateRef={idValidateRef}
                                                passwordValidateRef={passwordValidateRef}
                                                idRef={idRef}
                                                passwordRef={passwordRef}
                                                onClick={handleClick}
                                            />);
                                        }
                                    }
                                }
                        </PromiseFallback>
                    ) : (
                        <Form
                            idRequired={validateMemo[0]}
                            submitFailed={validateMemo[1]}
                            passwordRequired={validateMemo[2]}
                            submitText={textMemo[2]}
                            ipcFail={false}
                            idValidateRef={idValidateRef}
                            passwordValidateRef={passwordValidateRef}
                            idRef={idRef}
                            passwordRef={passwordRef}
                            onClick={handleClick}
                        />
                    )
                }
                <div className="w-auto text-center">
                    <p className="anchor-text" onClick={() => {
                        setIpcReady(false);
                        setEntryType((prev) => prev === "LOGIN" ? "REGISTER" : "LOGIN");
                    }}>{ textMemo[3] }</p>
                </div>
            </div>
        </>
    );
};