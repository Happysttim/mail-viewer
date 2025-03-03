import { BodyStructureSchema } from "lib/object/schema/imap";
import { z } from "zod";

type BodyStructure = z.infer<typeof BodyStructureSchema>;

const BODYSTRUCTURE_EXPR = /((text|image|application|audio|example|font|model|video) (.+?) (\(.+?\)|NIL) (.+?|NIL) (.+?|NIL) (.+?|NIL) (\d+?|NIL) (\d+?|NIL) (.+?|NIL) (\((.+?) (\(.+?\))\)||NIL) (.+?|NIL) (.+?|NIL))/g;
const MULTIPARTS_EXPR = /((mixed|alternative|related|form\-data|signed|encrypted|digest|paraellel|report|byteranges)) \(boundary (.+?)\) (.+?|NIL) (.+?|NIL) (.+?|NIL)?(?: \((.+?)\))?(?: (.+?|NIL))?\)/g;

export function bodystructure(str: string): BodyStructure {
    const structure: Partial<BodyStructure> = {};
    str = str.replaceAll(`"`, "");

    const structMatcher = [...str.matchAll(BODYSTRUCTURE_EXPR)];
    const multipartMatcher = [...str.matchAll(MULTIPARTS_EXPR)];

    if (multipartMatcher.length > 0) {
        return multipartParser(multipartMatcher, structMatcher);
    } else {
        return bodyParser(structMatcher[0]);
    }
}

function bodyParser(struct: RegExpExecArray): BodyStructure {
    const structure: Partial<BodyStructure> = {};
    structure.mimeType = struct[2];
    structure.subType = struct[3];
    
    if (struct[4] !== "NIL") {
        const subTypes = struct[4].replaceAll("(", "").replaceAll(")", "").split(" ");
        if (subTypes.length >= 2) {
            const parameters: {
                key: string,
                value: string,
            }[] = [];
            for (let i = 0; i < subTypes.length; i += 2) {
                parameters.push({
                    key: subTypes[i],
                    value: subTypes[i + 1],
                })
            }

            structure.parameters = parameters;
        }
    }

    structure.contentId = struct[5] === "NIL" ? undefined : struct[5];
    structure.contentDescription = struct[6] === "NIL" ? undefined : struct[6];
    structure.transferEncoding = struct[7] === "NIL" ? undefined : struct[7];
    structure.contentLength = struct[8] === "NIL" ? undefined : parseInt(struct[8]);
    structure.contentLine = struct[9] === "NIL" ? undefined : parseInt(struct[9]);
    structure.md5Hash = struct[10] === "NIL" ? undefined : struct[10];

    if (struct[11] !== "NIL" && struct[12]) {
        structure.contentDisposition = {
            type: struct[12],
        };

        if (struct[13]) {
            const dispositions = struct[13].replaceAll("(", "").replaceAll(")", "").split(" ");
            if (dispositions.length >= 2) {
                const parameters: {
                    key: string,
                    value: string,
                }[] = [];
                for (let i = 0; i < dispositions.length; i += 2) {
                    parameters.push({
                        key: dispositions[i],
                        value: dispositions[i + 1],
                    })
                }

                structure.contentDisposition = {
                    type: struct[12],
                    parameters,
                };
            }
        }
    }

    structure.location = struct[14] == "NIL" ? undefined : struct[14];

    return BodyStructureSchema.parse(structure);
}

function multipartParser(multiparts: RegExpExecArray[], structs: RegExpExecArray[]): BodyStructure {
    let result: Partial<BodyStructure> = {};
    let multipartIdx = 0, structIdx = 0;

    for (; multipartIdx < multiparts.length; multipartIdx++) {
        const multipartStart = multiparts[multipartIdx].index;
        const structures: Partial<BodyStructure> = {};
        structures.children = [];

        if (result.children) {
            structures.children.push(BodyStructureSchema.parse(result));
        }

        structures.mimeType = "multipart";
        structures.subType = multiparts[multipartIdx][1];

        for (; structIdx < structs.length && multipartStart > structs[structIdx].index; structIdx++) {
            structures.children.push(bodyParser(structs[structIdx]));
        }

        result = structures;
    }

    return BodyStructureSchema.parse(result);
}