import { useEffect, useRef, useState } from "react";

export const useDropdown = () => {
    const [ open, setOpen ] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (targetRef.current && !targetRef.current.contains(event.target as Node) && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return { open, setOpen, targetRef, dropdownRef };
};