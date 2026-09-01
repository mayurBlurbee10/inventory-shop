/**
 * Azure DevOps Service - Handles all Azure DevOps API operations
 */

import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.ZENDESK_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.ZENDESK_AZURE_TENANT_ID}`,
    clientSecret: process.env.ZENDESK_AZURE_CLIENT_SECRET!,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

interface AzureWorkItem {
  id: number;
  rev: number;
  fields: {
    "System.State": string;
    "System.Title": string;
    "System.Description": string;
    "System.Tags": string;
    "System.AssignedTo"?: {
      displayName: string;
      uniqueName: string;
    };
  };
  relations?: Array<{
    rel: string;
    url: string;
    attributes?: {
      comment?: string;
    };
  }>;
}

interface AzureUser {
  id: string;
  descriptor: string;
  subjectDescriptor: string;
  providerDisplayName: string;
  isActive: boolean;
}

/**
 * Get Azure DevOps access token
 */
export const getAzureAccessToken = async (): Promise<string> => {
  const response = await cca.acquireTokenByClientCredential({
    scopes: ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
  });

  if (!response?.accessToken) {
    throw new Error("Failed to get Azure access token");
  }

  return response.accessToken;
};

/**
 * Get Azure DevOps work item by ID
 */
export const getADOWorkItem = async (
  workItemId: number
): Promise<AzureWorkItem> => {
  const token = await getAzureAccessToken();

  const response = await fetch(
    `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/${workItemId}?api-version=7.1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || JSON.stringify(error) || "Unable to fetch ADO work item"
    );
  }

  return await response.json();
};

/**
 * Update Azure DevOps work item state
 */
export const updateADOStatus = async (
  workItemId: number,
  newState: string
): Promise<void> => {
  const token = await getAzureAccessToken();

  const body = [
    {
      op: "add",
      path: "/fields/System.State",
      value: newState,
    },
  ];

  const response = await fetch(
    `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/${workItemId}?api-version=7.1`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json-patch+json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || JSON.stringify(error) || "Failed to update ADO status");
  }
};

/**
 * Add comment to Azure DevOps work item
 */
export const addADOComment = async (
  workItemId: number,
  comment: string
): Promise<number> => {
  const token = await getAzureAccessToken();

  const response = await fetch(
    `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/${workItemId}/comments?api-version=7.1-preview.3`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: comment,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || JSON.stringify(error) || "Failed to add ADO comment");
  }

  const result = await response.json();
  return result.id;
};

/**
 * Get Azure DevOps user by email
 */
export const getADOUserByEmail = async (email: string): Promise<AzureUser | null> => {
  const token = await getAzureAccessToken();

  const response = await fetch(
    `https://vssps.dev.azure.com/mstrategygroup/_apis/identities?searchFilter=General&filterValue=${encodeURIComponent(email)}&api-version=7.1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.value?.[0] ?? null;
};

/**
 * Create Azure DevOps work item
 */
export const createAzureWorkItem = async (
  title: string,
  description: string,
  tags: string,
  isBug: boolean = false
): Promise<{ id: number }> => {
  const token = await getAzureAccessToken();

  const body: any[] = [
    {
      op: "add",
      path: "/fields/System.Title",
      value: title,
    },
    {
      op: "add",
      path: "/fields/System.Tags",
      value: tags,
    },
    isBug
      ? {
        op: "add",
        path: "/fields/Microsoft.VSTS.TCM.ReproSteps",
        value: description,
      }
      : {
        op: "add",
        path: "/fields/System.Description",
        value: description,
      },
    {
      op: "add",
      path: "/fields/System.AreaPath",
      value: "Universal Portal",
    },
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workItems/${process.env.ZENDESK_SUPPORT_EPIC_ID || "1780"}`,
        attributes: {
          comment: "Linked to Zendesk Support Epic",
        },
      },
    },
  ];

  const url = `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/$${isBug ? "Bug" : "Task"}?api-version=7.1-preview.3`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || JSON.stringify(error) || "Azure work item creation failed");
  }

  return await response.json();
};

/**
 * Extract Zendesk ticket ID from Azure DevOps work item tags
 */
export const getZendeskTicketIdFromADOWorkItem = (
  workItem: AzureWorkItem
): number | null => {
  const tags = workItem.fields["System.Tags"] || "";
  const match = tags.match(/Zendesk-(\d+)/i);
  return match ? Number(match[1]) : null;
};

/**
 * Add attachment relation to Azure DevOps work item
 */
export const attachFileToWorkItem = async (
  workItemId: number,
  attachmentUrl: string,
  comment: string = "Attachment"
): Promise<void> => {
  const token = await getAzureAccessToken();

  const body = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "AttachedFile",
        url: attachmentUrl,
        attributes: {
          comment,
        },
      },
    },
  ];

  const response = await fetch(
    `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/${workItemId}?api-version=7.1`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json-patch+json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || JSON.stringify(error) || "Failed to attach file to work item");
  }
};

/**
 * Get comments for Azure DevOps work item
 */
export const getADOComments = async (
  workItemId: number
): Promise<Array<{ id: number; text: string; createdDate: string; author: { displayName: string } }>> => {
  const token = await getAzureAccessToken();

  const response = await fetch(
    `https://dev.azure.com/mstrategygroup/Universal%20Portal/_apis/wit/workitems/${workItemId}/comments?api-version=7.1-preview.3`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || JSON.stringify(error) || "Failed to get ADO comments");
  }

  const data = await response.json();
  return data.comments || data.value || [];
};
