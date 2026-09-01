/**
 * Attachment Service - Handles attachment operations for both Zendesk and Azure DevOps
 */

import { getZendeskAuthHeaders } from "./zendesk.service.js";
import { getAzureAccessToken } from "./azure.service.js";

const ATTACHMENT_EXTENSIONS =
  "pdf|png|jpe?g|gif|svg|mp4|mov|avi|webm|mkv|m4v|wmv|flv|3gp";
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg)$/i;

/**
 * Download attachment from Zendesk
 */
export const downloadZendeskAttachment = async (
  contentUrl: string
): Promise<Buffer | null> => {
  const response = await fetch(contentUrl, {
    headers: getZendeskAuthHeaders(),
  });

  if (!response.ok) return null;

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Upload attachment to Azure DevOps
 */
export const uploadAzureAttachment = async (
  fileBuffer: Buffer,
  fileName: string
): Promise<string | null> => {
  const token = await getAzureAccessToken();

  const url = `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/attachments?fileName=${encodeURIComponent(
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

/**
 * Process Zendesk attachments and upload to Azure DevOps
 * Returns attachment relations for non-images and HTML for images
 */
export const processZendeskAttachments = async (
  attachments: Array<{
    id: number;
    file_name: string;
    content_url: string;
    content_type: string;
  }>
): Promise<{ relations: any[]; html: string }> => {
  const attachmentRelations: any[] = [];
  let attachedHtml = "";

  for (const attachment of attachments) {
    const fileBuffer = await downloadZendeskAttachment(attachment.content_url);

    if (!fileBuffer) continue;

    const adoAttachmentUrl = await uploadAzureAttachment(
      fileBuffer,
      attachment.file_name
    );

    if (!adoAttachmentUrl) continue;

    if (IMAGE_EXTENSIONS.test(attachment.file_name)) {
      attachedHtml += `<div><img src="${adoAttachmentUrl}" alt="${attachment.file_name}" /></div><br>`;
    } else {
      attachedHtml += `<div><b>Attached File:</b> <a href="${adoAttachmentUrl}" target="_blank">${attachment.file_name}</a></div><br>`;
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

  return { relations: attachmentRelations, html: attachedHtml };
};

/**
 * Download attachment from Azure DevOps
 */
export const downloadAzureAttachment = async (
  attachmentUrl: string
): Promise<Buffer | null> => {
  const token = await getAzureAccessToken();

  const response = await fetch(attachmentUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Upload attachment to Zendesk
 */
export const uploadZendeskAttachment = async (
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string | null> => {
  try {
    const url = `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/uploads.json?filename=${encodeURIComponent(filename)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getZendeskAuthHeaders(),
        "Content-Type": mimetype || "application/octet-stream",
      },
      body: new Uint8Array(fileBuffer),
    });

    const result = await response.json();

    if (response.ok && result.upload?.token) {
      return result.upload.token;
    }

    return null;
  } catch {
    return null;
  }
};
