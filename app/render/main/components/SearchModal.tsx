import { Button } from "app/render/common/components/Button";
import { DropdownRef, Input } from "app/render/common/components/Input";
import { Overlay } from "app/render/common/components/Overlay";
import { MailFilter } from "app/type";
import { format } from "date-fns";
import React, { RefObject, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type SearchModalProps = {
    onSubmit: (data: MailFilter) => void;
    onCancel: () => void;
    defaultFilter?: MailFilter;
};

export const SearchModal = ({ onSubmit, onCancel, defaultFilter }: SearchModalProps) => {
    const [ filter, setFilter ] = useState<MailFilter>();
    const [ startDate, setStartDate ] = useState("");
    const [ endDate, setEndDate ] = useState("");
    const [ fromLike, setFromLike ] = useState("");
    const [ subjectLike, setSubjectLike ] = useState("");
    const [ isSubmit, setIsSubmit ] = useState(false);
    const dropdownRef = useRef<DropdownRef>(null);

    useEffect(() => {
        if (defaultFilter) {
            setFilter(defaultFilter);

            setStartDate(defaultFilter.startDate || "");
            setEndDate(defaultFilter.endDate || "");
            setFromLike(defaultFilter.fromLike || "");
            setSubjectLike(defaultFilter.subjectLike || "");
            if (dropdownRef.current) {
                dropdownRef.current.setValue(
                    defaultFilter.seen === null ? "all" :
                    defaultFilter.seen === true ? "seen" : "unseen"
                );
            }
        }
    }, [ defaultFilter ]);

    useEffect(() => {
        if (filter && isSubmit) {
            setIsSubmit(false);
            onSubmit(filter);
        }
    }, [ filter, isSubmit ]);

    const handleClick = () => {
        const seen = (() => {
            if (dropdownRef.current) {
                const selected = dropdownRef.current.selectedOption;
                return selected.value === "all" ? undefined :
                        selected.value === "seen" ? true : false;
            }

            return undefined;
        })();

        setFilter({
            startDate: startDate.trim() === "" ? undefined : startDate,
            endDate: endDate.trim() === "" ? undefined : endDate,
            fromLike: fromLike.trim() === "" ? undefined : fromLike,
            subjectLike: subjectLike.trim() === "" ? undefined : subjectLike,
            seen,
        });

        setIsSubmit(true);
    };

    return (
        <Overlay>
            <div 
            className="absolute m-auto w-[650px] h-[450px] rounded-md inset-2 shadow-xl border border-gray-400 bg-white">
                <div className="info-form">
                    <div className="form-control">
                        <Input 
                        type="dropdown"
                        label="메일 상태"
                        options={[
                            { display: "전체", value: "all" },
                            { display: "읽음", value: "seen" },
                            { display: "안읽음", value: "unseen" },
                        ]}
                        ref={dropdownRef}
                        width={200} />
                    </div>
                    <div className="form-control">
                        <div className="flex items-center">
                            <span className="text-lg tracking-tighter mr-4">시작 날짜: </span>
                            <DatePicker
                            showTimeSelect
                            className="p-2 border border-gray-400 outline-none rounded-md"
                            placeholderText="yyyy-MM-dd HH:mm:ss"
                            dateFormat="yyyy-MM-dd"
                            timeFormat="HH:mm:ss"
                            dateFormatCalendar="yyyy-MM"
                            value={startDate}
                            onChange={(date) => {
                                if (date) {
                                    setStartDate(format(date, "yyyy-MM-dd HH:mm:ss"));
                                }
                            }} />
                        </div>
                    </div>
                    <div className="form-control">
                        <div className="flex items-center">
                            <span className="text-lg tracking-tighter mr-4">종료 날짜: </span>
                            <DatePicker
                            showTimeSelect
                            className="p-2 border border-gray-400 outline-none rounded-md"
                            placeholderText="yyyy-MM-dd HH:mm:ss"
                            dateFormat="yyyy-MM-dd"
                            timeFormat="HH:mm:ss"
                            dateFormatCalendar="yyyy-MM"
                            value={endDate}
                            onChange={(date) => {
                                if (date) {
                                    setEndDate(format(date, "yyyy-MM-dd HH:mm:ss"));
                                }
                            }} />
                        </div>
                    </div>
                    <div className="form-control">
                        <Input
                        type="text"
                        value={fromLike}
                        label="발신자 이름"
                        width={"full"}
                        placeholder="메일을 보낸 사람의 이름을 입력해보세요."
                        onChange={(value) => setFromLike(value)} />
                    </div>
                    <div className="form-control">
                        <Input
                        type="text"
                        value={subjectLike}
                        label="메일 제목"
                        width={"full"}
                        placeholder="메일의 제목을 입력해보세요."
                        onChange={(value) => setSubjectLike(value)} />
                    </div>
                    <div className="form-control mt-6">
                        <div className="flex w-full items-center">
                            <Button type="YES" text="검색" onClick={handleClick} />
                            <Button type="NO" text="취소" onClick={onCancel} />
                        </div>
                    </div>
                </div>
            </div>
        </Overlay>
    );
};