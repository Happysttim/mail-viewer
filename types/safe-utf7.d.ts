declare module "safe-utf7" {
    export function encode(str: string, mask: number): string;
    export function encodeAll(str: string): string;
    export function decode(str: string): string;
    type Imap = {
        encode: (str: string) => string;
        decode: (str: string) => string;
    };

    export const imap: Imap; 
}