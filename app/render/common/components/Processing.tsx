type ProcessingProp = {
    width: number;
    height: number;
    stroke: string;
};

export const Processing = ({ width, height, stroke }: ProcessingProp) => {
    return (
        <svg className="animate-spin" width={width} height={height} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="10" strokeWidth="1" fill="transparent" stroke={stroke} strokeDashoffset="100" strokeDasharray="30" strokeLinecap="round" />
        </svg>
    );
};