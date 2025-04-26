import React, { Fragment, useMemo, useState } from "react";

export const Entry = () => {

    const [ registerToggle, setToggle ] = useState(false);
    const messageMemo = useMemo(() => {
        return registerToggle ? [
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
    }, [ registerToggle ]);

    return (
        <Fragment>
            <div className="mt-28 ml-16">
                <p className="big-title text-white">{ messageMemo[0] }</p>
                <p className="big-title text-white">{ messageMemo[1] }</p>
            </div>
            <div className="w-60 h-full mt-52 mr-auto ml-auto">
                <div className="mb-3">
                    <input type="textbox" className="input-textbox" placeholder="ID" />
                </div>
                <div className="mb-3">
                    <input type="password" className="input-textbox" placeholder="PASSWORD" />
                </div>
                <div className="mb-6">
                    <button className="btn-lightAmber">{ messageMemo[2] }</button>
                </div>
                <div className="w-auto text-center">
                    <p className="anchor-text" onClick={() => setToggle(!registerToggle)}>{ messageMemo[3] }</p>
                </div>
            </div>
        </Fragment>
    );
};