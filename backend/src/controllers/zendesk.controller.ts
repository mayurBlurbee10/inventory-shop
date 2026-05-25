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
}

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

const fileToBuffer = async (file: any) => {
  if (file.buffer) {
    return file.buffer;
  }
  return Buffer.from([]);
};

const uploadFileBufferToZendesk = async (file: any): Promise<string | null> => {
  try {
    const formData = new FormData();
    const buffer = await fileToBuffer(file);
    formData.append(
      "file",
      new Blob([buffer], { type: file.mimetype || "application/octet-stream" }),
      file.originalname
    );
    formData.append("filename", file.originalname);

    const response = await fetch(
      `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/uploads.json`,
      {
        method: "POST",
        headers: getZendeskAuthHeaders(),
        body: formData,
      }
    );

    const result = await response.json();

    if (response.ok && result.upload?.token) {
      return result.upload.token;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const buildTicketData = ({
  subject,
  message,
  submitterEmail,
  uploadTokens,
  submitterName,
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
  },
});

const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  try {
    const formData = req.body;

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const subject = formData?.subject;
    const message = formData?.message;
    const submitterName = formData?.submitterName;
    const submitterEmail = formData?.submitterEmail;

    const files = Array.isArray(req.files) ? ((req.files as any[]) || []) : [];
    const uploadTokens: string[] = [];

    if (files.length > 0) {
      const uploadPromises = files.map((file) => uploadFileBufferToZendesk(file));
      const tokens = await Promise.all(uploadPromises);
      uploadTokens.push(...tokens.filter((token): token is string => token !== null));
    }

    const ticketData = buildTicketData({
      subject,
      message,
      submitterEmail,
      uploadTokens,
      submitterName,
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
