import { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";

interface ZendeskTicketResponse {
  ticket: {
    subject: string;
    comment: {
      body: string;
      uploads: string[];
    };
    requester: {
      name: string;
      email: string;
    };
    tags: string[];
  };
}

interface BuildTicket {
  subject: string;
  message: string;
  uploadTokens: string[];
  submitterName: string;
  submitterEmail: string;
  project?: string;
}

interface AttachmentInput {
  filename?: string;
  contentType?: string;
  dataBase64?: string;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const getZendeskAuthHeaders = () => ({
  Authorization:
    "Basic " +
    btoa(`${process.env.ZENDESK_ADMIN_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`),
});

const createZendeskTicket = async (ticketData: ZendeskTicketResponse) => {
  const response = await fetch(
    `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/tickets.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getZendeskAuthHeaders(),
      },
      body: JSON.stringify(ticketData),
    }
  );

  const result = await response.json();
  const ticketId = result.ticket?.id;

  if (response.ok && ticketId) {
    console.log("Zendesk ticket created successfully:", ticketId);
    return { success: true, ticketId, result };
  }
  console.error("Zendesk API error:", result);
  const errorMessage =
    result.error || result.description || "Failed to create Zendesk ticket";
  throw new Error(errorMessage);
};

const validateFormData = (body: any) => {
  const subject = body?.subject;
  const message = body?.message;
  const submitterName = body?.submitterName;
  const submitterEmail = body?.submitterEmail;

  if (!subject || !message || !submitterEmail || !submitterName) {
    return {
      isValid: false,
      error:
        "Missing required fields: subject, message, submitter email, and submitter name",
    };
  }

  return { isValid: true };
};

/** Upload binary to Zendesk uploads.json (multipart), returns upload token */
const uploadBufferToZendesk = async (
  buffer: Buffer,
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
      body: new Uint8Array(buffer),
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

const collectUploadTokensFromAttachments = async (
  attachments: unknown
): Promise<string[]> => {
  if (attachments == null) {
    return [];
  }
  if (!Array.isArray(attachments)) {
    throw new Error("attachments must be an array when provided");
  }

  const tokens: string[] = [];

  for (const raw of attachments) {
    const item = raw as AttachmentInput;
    const filename = item?.filename?.trim();
    const dataBase64 = item?.dataBase64;
    const contentType = item?.contentType?.trim() || "application/octet-stream";

    if (!filename || !dataBase64) {
      throw new Error("Each attachment requires filename and dataBase64");
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(dataBase64, "base64");
    } catch {
      throw new Error(`Invalid base64 for attachment: ${filename}`);
    }

    if (buffer.length > MAX_FILE_BYTES) {
      throw new Error(`Attachment too large: ${filename}`);
    }

    const token = await uploadBufferToZendesk(buffer, filename, contentType);
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
};

const buildTicketData = ({
  subject,
  message,
  submitterEmail,
  uploadTokens,
  submitterName,
  project,
}: BuildTicket) => ({
  ticket: {
    subject,
    comment: {
      body: message,
      uploads: uploadTokens,
    },
    requester: {
      name: submitterName || submitterEmail.split("@")[0],
      email: submitterEmail,
    },
    tags: ["portal_submission"],
    custom_fields: [
      {
        id: 49353767043988,
        value: project
      }
    ]
  },
});

const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const validation = validateFormData(body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const subject = body?.subject;
    const message = body?.message;
    const submitterName = body?.submitterName;
    const submitterEmail = body?.submitterEmail;
    const project = body?.project;

    let uploadTokens: string[] = [];
    try {
      const multerFiles = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
      if (multerFiles.length > 0) {
        const tokens = await Promise.all(
          multerFiles.map((file) =>
            uploadBufferToZendesk(file.buffer, file.originalname, file.mimetype)
          )
        );
        uploadTokens = tokens.filter((t): t is string => Boolean(t));
      } else if (body?.attachments != null) {
        uploadTokens = await collectUploadTokensFromAttachments(body.attachments);
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: (e as Error).message,
      });
    }

    const ticketData = buildTicketData({
      subject,
      message,
      submitterEmail,
      uploadTokens,
      submitterName,
      project,
    } as BuildTicket);

    const { ticketId } = await createZendeskTicket(ticketData);

    return res.status(200).json({
      success: true,
      message: "Support ticket created successfully",
      ticketId,
      ticketUrl: `${process.env.ZENDESK_SUBDOMAIN_URL}/requests/${ticketId}`,
      uploadedFiles: uploadTokens.length,
    });
  } catch (error) {
    console.error("Error creating Zendesk ticket:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create support ticket",
      details: (error as Error).message,
    });
  }
});

export default {
  createSupportTicket,
};
