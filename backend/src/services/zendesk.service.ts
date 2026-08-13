/**
 * Zendesk Service - Handles all Zendesk API operations
 */

interface ZendeskTicketResponse {
  ticket: {
    id: number;
    status: string;
    priority: string | null;
    subject: string;
    description: string;
    updated_at: string;
    assignee_id: number | null;
    custom_fields?: Array<{ id: number; value: string }>;
  };
}

interface ZendeskComment {
  id: number;
  body: string;
  html_body: string;
  public: boolean;
  created_at: string;
  author_id: number;
  attachments: Array<{
    id: number;
    file_name: string;
    content_url: string;
    content_type: string;
  }>;
}

interface ZendeskTicketUpdate {
  ticket: {
    status?: string;
    comment?: {
      body?: string;
      html_body?: string;
      public?: boolean;
    };
    custom_fields?: Array<{ id: number; value: string }>;
  };
}

const ZENDESK_AZURE_WORKITEM_FIELD_ID = 52226334054036;

export const getZendeskAuthHeaders = (): Record<string, string> => ({
  Authorization:
    "Basic " +
    Buffer.from(
      `${process.env.ZENDESK_ADMIN_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`
    ).toString("base64"),
});

/**
 * Get Zendesk ticket by ID
 */
export const getZendeskTicket = async (
  ticketId: number
): Promise<ZendeskTicketResponse["ticket"]> => {
  const response = await fetch(
    `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/tickets/${ticketId}.json`,
    {
      headers: getZendeskAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || error.description || "Unable to fetch Zendesk ticket"
    );
  }

  const data = await response.json();
  return data.ticket;
};

/**
 * Get comments for a Zendesk ticket
 */
export const getZendeskComments = async (
  ticketId: number
): Promise<ZendeskComment[]> => {
  const response = await fetch(
    `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/tickets/${ticketId}/comments.json`,
    {
      headers: getZendeskAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || error.description || "Unable to fetch Zendesk comments"
    );
  }

  const data = await response.json();
  return data.comments;
};

/**
 * Update Zendesk ticket
 */
export const updateZendeskTicket = async (
  ticketId: number,
  updateData: ZendeskTicketUpdate
): Promise<any> => {
  const url = `${process.env.ZENDESK_SUBDOMAIN_URL}/api/v2/tickets/${ticketId}.json`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...getZendeskAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || error.description || "Failed to update Zendesk ticket"
    );
  }

  return await response.json();
};

/**
 * Update Zendesk ticket with Azure Work Item ID
 */
export const updateZendeskTicketWithAzureId = async (
  ticketId: number,
  workItemId: number
): Promise<any> => {

  console.log(ticketId, workItemId, '===============')
  return updateZendeskTicket(ticketId, {
    ticket: {
      custom_fields: [
        {
          id: ZENDESK_AZURE_WORKITEM_FIELD_ID,
          value: workItemId.toString(),
        },
      ],
    },
  });
};

/**
 * Add comment to Zendesk ticket
 */
export const addZendeskComment = async (
  ticketId: number,
  comment: string,
  isPublic: boolean = true
): Promise<any> => {
  return updateZendeskTicket(ticketId, {
    ticket: {
      comment: {
        html_body: comment,
        public: isPublic,
      },
    },
  });
};

/**
 * Update Zendesk ticket status
 */
export const updateZendeskTicketStatus = async (
  ticketId: number,
  status: string
): Promise<any> => {
  return updateZendeskTicket(ticketId, {
    ticket: {
      status,
    },
  });
};

/**
 * Extract Azure Work Item ID from Zendesk ticket custom field
 */
export const getAzureWorkItemIdFromZendeskTicket = (
  ticket: ZendeskTicketResponse["ticket"]
): number | null => {
  if (!ticket.custom_fields) return null;

  const customField = ticket.custom_fields.find(
    (field) => field.id === ZENDESK_AZURE_WORKITEM_FIELD_ID
  );

  return customField?.value ? Number(customField.value) : null;
};
