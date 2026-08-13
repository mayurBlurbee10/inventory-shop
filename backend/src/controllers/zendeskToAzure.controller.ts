import { Request, response, Response } from "express";
import { asyncHandler } from "../utils/helper.js";
import { createAzureWorkItem } from "../services/azure.service.js";
import { updateZendeskTicketWithAzureId } from "../services/zendesk.service.js";
import { processZendeskAttachments } from "../services/attachment.service.js";

interface AzurePayloadOp {
    op: string;
    path: string;
    value: string;
}

interface Attachment {
    id: number;
  file_name: string;
    content_url: string;
  content_type: string;
}

const ATTACHMENT_EXTENSIONS =
  "pdf|png|jpe?g|gif|svg|mp4|mov|avi|webm|mkv|m4v|wmv|flv|3gp";
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg)$/i;

/**
 * Create Azure DevOps work item from Zendesk ticket payload
 * This handles the initial ticket creation flow
 */
const createAzureWorkItemFromPayload = async (
  payload: AzurePayloadOp[]
): Promise<any> => {

  console.log(payload,'===============')
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

    let updatedDescription = descriptionOp?.value || "";
    const attachments: Attachment[] = [];

  const attachmentSection = updatedDescription.match(
    /Attachment\(s\):([\s\S]*)/i
  );

  if (attachmentSection) {
    const attachmentRegex = new RegExp(
      `(.+?\\.(?:${ATTACHMENT_EXTENSIONS}))\\s-\\s(https:\\/\\/.*?\\.(?:${ATTACHMENT_EXTENSIONS}))`,
      "gi"
    );

    let match: RegExpExecArray | null;
    let idCounter = 1;

    while ((match = attachmentRegex.exec(attachmentSection[1])) !== null) {
      attachments.push({
        id: idCounter++,
        file_name: match[1].trim(),
        content_url: match[2].trim(),
        content_type: "application/octet-stream",
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

  // Process attachments
  const { relations, html } = await processZendeskAttachments(attachments);
  updatedDescription += html;

  const isBug = titleOp?.value?.toLowerCase() === "bug";

  const azureWorkItem = await createAzureWorkItem(
    `[Universal Portal] Zendesk - ${zendeskTicketId}`,
    updatedDescription,
    tagsOp?.value ? `${tagsOp.value}; Zendesk` : "Zendesk",
    isBug
  );

  // Add attachment relations if any
  if (relations.length > 0) {
    const { attachFileToWorkItem } = await import("../services/azure.service.js");
    for (const relation of relations) {
      await attachFileToWorkItem(
        azureWorkItem.id,
        relation.value.url,
        relation.value.attributes.comment
      );
    }
  }

  return azureWorkItem;
};

/**
 * Create Zendesk ticket and sync to Azure DevOps
 * This is the initial ticket creation endpoint
 */
const createZendeskToAzureTicket = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const payload: AzurePayloadOp[] = req.body;
            console.log(req.body,'--------------')

      const tagsOp = payload.find(
        (op: AzurePayloadOp) => op.path === "/fields/System.Tags"
      );

      const zendeskIdMatch = tagsOp?.value?.match(/Zendesk-(\d+)/i);
      const zendeskTicketId = zendeskIdMatch?.[1];

      console.log(`Creating ADO work item for Zendesk ticket ${zendeskTicketId}`);

      const azureWorkItem = await createAzureWorkItemFromPayload(payload);

      console.log(`Updating Zendesk ticket ${zendeskTicketId} with ADO ID ${azureWorkItem.id}`);
      await updateZendeskTicketWithAzureId(
        Number(zendeskTicketId!),
        azureWorkItem.id
      );

      return res.status(200).json({
        success: true,
        azureWorkItemId: azureWorkItem.id,
      });
    } catch (error) {
      console.error("Error creating Zendesk to Azure ticket:", error);
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