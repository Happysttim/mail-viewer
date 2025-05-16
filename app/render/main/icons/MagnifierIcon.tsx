import { IconProps } from "./IconProps";

export const MagnifierIcon = ({ width, height }: IconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.3505 3.29839C6.3505 4.82627 5.05877 6.09677 3.42525 6.09677C1.79172 6.09677 0.5 4.82627 0.5 3.29839C0.5 1.7705 1.79172 0.5 3.42525 0.5C5.05877 0.5 6.3505 1.7705 6.3505 3.29839Z" stroke="#3C3C3C"/>
            <line y1="-0.5" x2="4.05157" y2="-0.5" transform="matrix(0.792188 0.610278 -0.63902 0.76919 5.48041 5.27734)" stroke="black"/>
        </svg>
    );
};