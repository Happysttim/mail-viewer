import { IconProps } from "./IconProps";

export const ReloadIcon = ({ width, height }: IconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 30 30">
            <path d="
                M 15,15
                m 0,-10
                a 10,10,0,1,0,0,20
                m -10,-10
                a 10,10,0,0,0,20,0
                m 0,0
                l -5, 3
                m 5, -3
                l 3.5, 3
                " fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};