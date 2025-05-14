import { z } from "zod";

type ContentHeaderSchemaType = {
    mimeVersion?: string,
    contentType?: string,
    parameters?: {
        key: string,
        value: string
    }[],
    contentTransferEncoding?: string,
    contentDisposition?: string,
    contentId?: string,
    contentDescription?: string,
};

export const ErrorSchema = z.object({
    error: z.boolean(),
    result: z.object({}).optional(),
});

export const ContentHeaderSchema: z.ZodType<ContentHeaderSchemaType> = z.object({
    mimeVersion: z.string().optional(),
    contentType: z.string().optional(),
    parameters: z.array(
        z.object({
            key: z.string(),
            value: z.string(),
        })
    ).default([]),
    contentTransferEncoding: z.string().optional(),
    contentDisposition: z.string().optional(),
    contentId: z.string().optional(),
    contentDescription: z.string().optional(),
});

type ContentSchemaType = {
    contentHeader: z.infer<typeof ContentHeaderSchema>,
    mimePart: string,
    contentBody?: string,
    children?: ContentSchemaType[],
};

export const ContentSchema: z.ZodType<ContentSchemaType> = z.object({
    contentHeader: ContentHeaderSchema,
    mimePart: z.string(),
    children: z.array(z.lazy(() => ContentSchema)).default([]),
    contentBody: z.string().optional(),
});