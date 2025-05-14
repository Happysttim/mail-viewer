export const convertBase64 = (input: string): Buffer<ArrayBuffer> => {
    return Buffer.from(input, "base64");
};

export const decode = (input: string) => {
    if (!/^\&.+\-$/.test(input)) {
        return input;
    }

    const buffer = convertBase64(input);
    const result = [];

    for (let i = 0; i < buffer.length;) {
        result.push(String.fromCharCode(buffer[i++] << 8 | buffer[i++]));
    }

    return result.join("");
};