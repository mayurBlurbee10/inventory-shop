/**
 * Azure DevOps to Zendesk Controller
 * Handles Azure DevOps webhooks and syncs updates to Zendesk
 */

import { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.js";
import { syncADOToZendesk } from "../services/sync.service.js";

interface ADOWebhookPayload {
  subscriptionId: string;
  id: string;
  eventType: string;
  publisherId: string;
  message: {
    text: string;
    html: string;
    markdown: string;
  };
  resource: {
    id: string | number;
    rev: number;
    fields: {
      "System.State"?: string;
      "System.Title"?: string;
      "System.Tags"?: string;
    };
    relations?: any[];
  };
  resourceVersion: string;
  createdDate: string;
}

/**
 * Handle Azure DevOps work item update webhook
 */
const handleADOUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      console.log("\n==================================================");
      console.log("🚀 /api/azure-to-zendesk/update WEBHOOK HIT!");
      console.log("==================================================");
      
      const payload: ADOWebhookPayload = req.body;

      console.log("ADO webhook received:", {
        eventType: payload?.eventType,
        workItemId: (payload?.resource as any)?.workItemId || payload?.resource?.id,
        state: (payload?.resource as any)?.fields?.["System.State"] || "N/A",
      });

      // Only process work item updated or commented events
      if (
        payload.eventType !== "workitem.updated" &&
        payload.eventType !== "workitem.commented"
      ) {
        return res.status(200).json({
          success: true,
          message: "Event type not processed",
        });
      }

      const workItemId = Number(
        (payload.resource as any)?.workItemId || payload.resource?.id
      );

      if (!workItemId) {
        throw new Error("Missing work item ID in ADO webhook payload");
      }

      await syncADOToZendesk(workItemId);

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error("Error syncing ADO to Zendesk:", error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
);

export default {
  handleADOUpdate,
};
