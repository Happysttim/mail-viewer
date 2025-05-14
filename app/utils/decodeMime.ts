import { mimeWordsDecode } from "emailjs-mime-codec";

export const decodeMime = (input: string) => {
    return mimeWordsDecode(input);
};