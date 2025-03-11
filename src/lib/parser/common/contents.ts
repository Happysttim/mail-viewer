import { ContentHeaderSchema, ContentSchema } from "lib/schema/common";
import { z } from "zod";

type Parameter = Record<string, string | undefined>; 
type ContentSchemaType = z.infer<typeof ContentSchema>;
type ContentStack = {
    contents: string,
    mimePart: string,
    tree: ContentSchemaType[],
}[];

export function contentSchema(buffer: string): z.infer<typeof ContentSchema> | undefined {
    const header = buffer.substring(0, buffer.indexOf("\r\n\r\n")).replaceAll("\t", "");
    const contents = buffer.substring(buffer.indexOf("\r\n\r\n"));
    const contentHeader = contentHeaderSchema(header);
    const result: Partial<ContentSchemaType> = {
        children: [],
        contentHeader,
        mimePart: "1",
    };

    const contentStack: ContentStack = [
        {
            contents: contents,
            mimePart: "1",
            tree: result.children!,
        }
    ];

    if (!validParameter(contentHeader, "boundary")) {
        result.contentBody = contents;
        return ContentSchema.parse(result);
    }

    while (contentStack.length > 0) {
        const { contents, mimePart, tree } = contentStack.pop()!!;
        const boundaryName = extractBoundaryOnStart(contents)!!;
        const sectionPoints = extractBoundarySectionPoints(contents, boundaryName);

        for (let i = 0; i < sectionPoints.length; i++) {
            const childHeader = extractContentsHeader(contents, sectionPoints[i]);
            const childHeaderSchema = contentHeaderSchema(childHeader);
            const childContent: ContentSchemaType = {    
                contentHeader: childHeaderSchema,
                mimePart: `${mimePart}.${i + 1}`,
                children: [],
            }
            
            if (validParameter(childHeaderSchema, "boundary")) {
                contentStack.push(
                    {
                        contents: contents.substring(contents.indexOf("\r\n\r\n", sectionPoints[i] + 1)).trim(),
                        mimePart: `${mimePart}.${i + 1}`,
                        tree: childContent.children!,
                    }
                );
            } else {
                childContent.contentBody = extractContentsBody(contents, sectionPoints[i], i == sectionPoints.length - 1 ? extractBoundaryEndPoint(contents, boundaryName) : sectionPoints[i + 1]);
            }

            tree.push(childContent);
        }
    }

    return ContentSchema.parse(result);
}

function validParameter (header: z.infer<typeof ContentHeaderSchema>, target: string): boolean {
    return header.parameters ? header.parameters.find(parameter => parameter.key === target) !== undefined : false;
}


function contentHeaderSchema (header: string): z.infer<typeof ContentHeaderSchema> {
    const contentHeaderSchema: Partial<z.infer<typeof ContentHeaderSchema>> = {};
    contentHeaderSchema.parameters = [];

    const parameter: Parameter = {};
    const matches = header.replace("\t", "").matchAll(/\r\n{0,}([^:\"]+)\:(.+)/gm);

    for (const match of matches) {
        const key = match[1].trim().toLowerCase();
        switch (key) {
            case "mime-version":
                contentHeaderSchema.mimeVersion = match[2].trim();
                break;
            case "content-type":
                contentHeaderSchema.contentType = match[2].trim() ?? "";
                const mimeType = match[2].trim().split("/");

                if (mimeType[0] === "multipart") {
                    const boundary = extractParameterInHeader(header, "boundary");
                    parameter["boundary"] = boundary;
                }
                
                parameter["charset"] = extractParameterInHeader(header, "charset") ?? "US-ASCII";
                
                break;
            case "content-transfer-encoding":
                contentHeaderSchema.contentTransferEncoding = match[2].trim();
                break;
            case "content-disposition":
                contentHeaderSchema.contentDisposition = match[2].trim();

                parameter["filename"] = extractParameterInHeader(header, "filename");
                parameter["filename*"] = extractParameterInHeader(header, "filename*");
                parameter["name"] = extractParameterInHeader(header, "name");
                parameter["creationDate"] = extractParameterInHeader(header, "creation-date");
                parameter["modificationDate"] = extractParameterInHeader(header, "modification-date");
                parameter["readDate"] = extractParameterInHeader(header, "read-date");
                parameter["size"] = extractParameterInHeader(header, "size");

                break;
            case "content-id":
                contentHeaderSchema.contentId = match[2].trim();
            case "content-description":
                contentHeaderSchema.contentDescription = match[2].trim();
            default:
        }
    }

    Object.entries(parameter).forEach(([key, value]) => {
        if (value) {
            contentHeaderSchema.parameters?.push({ key, value });
        }
    });

    return ContentHeaderSchema.parse(contentHeaderSchema);
}

function extractParameterInHeader (header: string, target: string): string | undefined {
    const expr = new RegExp(`[\t ]?${target}=(.+)[\r\n]?`, "m");
    const parameterValue = header.match(expr);
    
    return parameterValue ? parameterValue[1].replaceAll("\"", "") ?? undefined : undefined;
}

function extractBoundaryOnStart (contents: string): string | undefined {
    const match = contents.match(/^[\r\n]{0,}\-{2}(.+)[\r\n]/);

    return match ? match[1] ?? undefined : undefined;
}

function extractBoundarySectionPoints (contents: string, boundary: string): number[] {
    const expr = new RegExp(`[\r\n]{0,}\-{2}${boundary}(?!\-{2})[\r\n]`, "gm");

    return [...contents.matchAll(expr)].map<number>(value => value.index);
}

function extractBoundaryEndPoint (contents: string, boundary: string): number {
    const expr = new RegExp(`([\r\n]{0,}\-{2}${boundary}\-{2})[\r\n]?`);
    const end = contents.match(expr);

    return end ? end.index ?? 0 : 0;
}

function extractBoundaryStartPoint (contents: string, boundary: string): number {
    const expr = new RegExp(`[\r\n]{0,}(\-{2})(${boundary})(?!\-{2})[\r\n]`);
    const start = contents.match(expr);

    return start ? start.index ?? 0 : 0;
}

function extractContentsHeader (contents: string, boundaryPos: number): string {
    return contents.substring(
        boundaryPos, 
        contents.indexOf(
            "\r\n\r\n",
            boundaryPos + 1,
        ),
    ).trim();
}

function extractContentsBody (contents: string, boundaryPos: number, endPos: number): string {
    return contents.substring(
            contents.indexOf(
                "\r\n\r\n",
                boundaryPos + 1,
            ), 
            endPos
        ).trim();
}