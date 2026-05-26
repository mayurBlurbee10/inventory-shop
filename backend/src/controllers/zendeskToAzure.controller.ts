import { Request, response, Response } from "express";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { asyncHandler } from "../utils/helper.js";

interface AzurePayloadOp {
    op: string;
    path: string;
    value: string;
}

interface Attachment {
    file_name: string;
    content_url: string;
}

const msalConfig = {
    auth: {
        clientId: process.env.ZENDESK_AZURE_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.ZENDESK_AZURE_TENANT_ID}`,
        clientSecret: process.env.ZENDESK_AZURE_CLIENT_SECRET!,
    },
};

const cca = new ConfidentialClientApplication(msalConfig);

const getAzureAccessToken = async (): Promise<string> => {
    const response = await cca.acquireTokenByClientCredential({
        scopes: ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
    });

    if (!response?.accessToken) {
        throw new Error("Failed to get Azure access token");
    }

    return response.accessToken;
};

const getZendeskAuthHeaders = (): Record<string, string> => ({
    Authorization:
        "Basic " +
        Buffer.from(
            `${process.env.ZENDESK_ADMIN_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`
        ).toString("base64"),
});

const downloadZendeskAttachment = async (
    contentUrl: string
): Promise<Buffer | null> => {
    const response = await fetch(contentUrl, {
        headers: getZendeskAuthHeaders(),
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

const uploadAzureAttachment = async (
    token: string,
    fileBuffer: Buffer,
    fileName: string
): Promise<string | null> => {
    const url = `https://dev.azure.com/mstrategygroup/MStrategyGroupCore/_apis/wit/attachments?fileName=${encodeURIComponent(
        fileName
    )}&api-version=7.1`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(fileBuffer),
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.url;
};

const createAzureWorkItem = async (
    payload: AzurePayloadOp[]
): Promise<any> => {
    const token = await getAzureAccessToken();

    const titleOp = payload.find(
        (op: AzurePayloadOp) => op.path === "/fields/System.Title"
    );

    const descriptionOp = payload.find(
        (op: AzurePayloadOp) => op.path === "/fields/System.Description"
    );

    const tagsOp = payload.find(
        (op: AzurePayloadOp) => op.path === "/fields/System.Tags"
    );

    const zendeskIdMatch = tagsOp?.value?.match(/Zendesk-(\d+)/i);
    const zendeskTicketId = zendeskIdMatch?.[1] || null;

    const url = `https://dev.azure.com/mstrategygroup/MStrategyGroupCore/_apis/wit/workitems/$${titleOp?.value}?api-version=7.1-preview.3`;

    let updatedDescription = descriptionOp?.value || "";
    const attachments: Attachment[] = [];

    const attachmentSection = updatedDescription.match(
        /Attachment\(s\):([\s\S]*)/i
    );

    if (attachmentSection) {
        const attachmentRegex =
            /(.+?\.(?:pdf|png|jpe?g|gif|svg))\s-\s(https:\/\/.*?\.(?:pdf|png|jpe?g|gif|svg))/gi;

        let match: RegExpExecArray | null;

        while ((match = attachmentRegex.exec(attachmentSection[1])) !== null) {
            attachments.push({
                file_name: match[1].trim(),
                content_url: match[2].trim(),
            });
        }
    }


    updatedDescription = updatedDescription
        .replace(/Attachment\(s\):[\s\S]*/i, "")
        .replace(/----------------------------------------------/g, "")
        .replace(
            /^[A-Za-z\s]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s+/gm,
            ""
        )
        .trim();

    const attachmentRelations: any[] = [];
    let attachedHtml = "";

    for (const attachment of attachments) {
        const fileBuffer = await downloadZendeskAttachment(
            attachment.content_url
        );

        if (!fileBuffer) continue;

        const adoAttachmentUrl = await uploadAzureAttachment(
            token,
            fileBuffer,
            attachment.file_name
        );

        if (!adoAttachmentUrl) continue;

        if (attachment.file_name.match(/\.(png|jpe?g|gif|svg)$/i)) {
            attachedHtml += `<div><img src="${adoAttachmentUrl}" /></div>`;
        } else {
            attachmentRelations.push({
                op: "add",
                path: "/relations/-",
                value: {
                    rel: "AttachedFile",
                    url: adoAttachmentUrl,
                    attributes: {
                        comment: "Attachment from Zendesk",
                    },
                },
            });
        }
    }

    updatedDescription += attachedHtml;

    const body = [
        {
            op: "add",
            path: "/fields/System.Title",
            value: `Zendesk - ${zendeskTicketId}`,
        },
        {
            op: "add",
            path: "/fields/System.Description",
            value: updatedDescription,
        },
        {
            op: "add",
            path: "/fields/System.AreaPath",
            value: "MStrategyGroupCore\\Zendesk Support Tickets",
        },
        ...attachmentRelations,
    ];

    console.log(body, 'body----------------------------')

    // return response.status(200).json({
    //     success: true,
    //     body,
    // })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Azure work item creation failed");
    }

    return result;
};

const createZendeskToAzureTicket = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const payload: AzurePayloadOp[] = req.body;

            const azureTicket = await createAzureWorkItem(payload);

            return res.status(200).json({
                success: true,
                azureWorkItemId: azureTicket.id,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }
);

export default {
    createZendeskToAzureTicket,
};