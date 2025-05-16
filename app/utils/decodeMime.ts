import { mimeWordsDecode, quotedPrintableDecode } from "emailjs-mime-codec";
import { ContentSchemaType } from "lib/schema/common";
import iconv from "iconv-lite";
import { File, Mime } from "app/type";

export const decodeWords = (input: string) => {
    return mimeWordsDecode(input);
};

export const decodeMime = (contentSchema: ContentSchemaType): Mime[] => {
    const result: Mime[] = [];

    if (contentSchema.contentHeader.contentType) {
        if (contentSchema.contentHeader.contentType.startsWith("multipart")) {
            if (
                contentSchema.children &&
                contentSchema.children.length > 0
            ) {
                for (const child of contentSchema.children) {
                    result.push(...decodeMime(child));
                }
            }
        } else {
            const charset = contentSchema.contentHeader.parameters?.find(
                (value) => value.key === "charset"
            ) ?? {
                key: "charset",
                value: "utf-8"
            };

            const transferEncoding = contentSchema.contentHeader.contentTransferEncoding;
            const file: File | undefined = (() => {
                const filename = contentSchema.contentHeader.parameters?.find(
                    (value) => /^(filename\*|filename|name)/.test(value.key)
                );

                if (!filename) {
                    return;
                }

                return {
                    filename: decodeWords(filename.value),
                    contentId: contentSchema.contentHeader.contentId,
                };
            })();

            const decodeBuffer = (() => {
                if (contentSchema.contentBody) {
                    switch (transferEncoding?.toLowerCase()) {
                        case "base64":
                            return Buffer.from(contentSchema.contentBody, "base64");
                        case "quoted-printable":
                            return Buffer.from(quotedPrintableDecode(contentSchema.contentBody));
                        case "binary":
                        case "7bit":
                        case "8bit":
                        default:
                            return Buffer.from(contentSchema.contentBody, "binary");
                    }
                }

                return Buffer.from("", "binary");
            })();

            const contentBody = contentSchema.contentHeader.contentType.startsWith("text/") ?
                iconv.decode(decodeBuffer, charset.value) : 
                contentSchema.contentHeader.contentId ? 
                Buffer.from(decodeBuffer).toString(transferEncoding as BufferEncoding) : decodeBuffer;

            return [{
                part: contentSchema.mimePart,
                contentTransferEncoding: transferEncoding,
                contentType: contentSchema.contentHeader.contentType,
                contentBody,
                file,
            }];
        }
    }

    return result;
};