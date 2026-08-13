/**
 * Sync Service - Orchestrates bidirectional synchronization between Zendesk and Azure DevOps
 */

import { AppDataSource } from "../config/db.js";
import { TicketSync } from "../entities/TicketSync.js";
import {
  getZendeskTicket,
  getZendeskComments,
  updateZendeskTicketStatus,
  addZendeskComment,
  getAzureWorkItemIdFromZendeskTicket,
} from "./zendesk.service.js";
import {
  getADOWorkItem,
  updateADOStatus,
  addADOComment,
  getADOUserByEmail,
  getZendeskTicketIdFromADOWorkItem,
  getADOComments,
} from "./azure.service.js";
import {
  processZendeskAttachments,
  downloadAzureAttachment,
  uploadZendeskAttachment,
} from "./attachment.service.js";
import { mapZendeskStatusToADO, mapADOStateToZendesk } from "../utils/statusMapping.js";

/**
 * Sync Zendesk ticket update to Azure DevOps
 * Handles status, comments, and attachments
 */
export const syncZendeskToADO = async (payload: {
  ticket_id: number;
  azure_work_item_id: string;
  status?: string;
  comment?: string;
  assignee_email?: string;
}): Promise<void> => {
  const { ticket_id, azure_work_item_id, status, comment, assignee_email } = payload;

  if (!azure_work_item_id) {
    throw new Error("Azure Work Item ID missing");
  }

  const workItemId = Number(azure_work_item_id);

  // Get or create sync record
  const ticketSyncRepo = AppDataSource.getRepository(TicketSync);
  let ticketSync = await ticketSyncRepo.findOne({
    where: { zendeskTicketId: ticket_id },
  });

  if (!ticketSync) {
    ticketSync = ticketSyncRepo.create({
      zendeskTicketId: ticket_id,
      azureWorkItemId: workItemId,
      lastSyncSource: "zendesk",
      lastSyncedAt: new Date(),
    });
    await ticketSyncRepo.save(ticketSync);
  }

  // Get current ADO state to prevent unnecessary updates
  const adoWorkItem = await getADOWorkItem(workItemId);
  const currentADOState = adoWorkItem.fields["System.State"];

  // Sync status if provided and different
  if (status) {
    const targetADOState = mapZendeskStatusToADO(status);
    if (currentADOState !== targetADOState) {
      console.log(
        `Syncing status: Zendesk ${status} -> ADO ${targetADOState} (current: ${currentADOState})`
      );
      await updateADOStatus(workItemId, targetADOState);
    }
  }

  // Sync comment if provided
  if (comment?.trim()) {
    const user = assignee_email ? await getADOUserByEmail(assignee_email) : null;

    // Fetch latest comment with attachments
    let formattedComment = comment.replace(/\n/g, "<br>");
    let attachedHtml = "";
    let attachmentRelations: any[] = [];

    if (ticket_id) {
      try {
        const comments = await getZendeskComments(ticket_id);
        if (comments && comments.length > 0) {
          const latestComment = comments[comments.length - 1];

          // Loop prevention: If the Zendesk comment was created by our ADO sync, it will contain this signature
          if (
            (latestComment.body && latestComment.body.includes("From Developer:")) ||
            (latestComment.html_body && latestComment.html_body.includes("From Developer:")) ||
            (comment && comment.includes("From Developer:"))
          ) {
            console.log("Loop prevention: Skipping Zendesk comment because it originated from ADO");
            return;
          }

          // Check if this comment has already been synced
          if (String(ticketSync.lastZendeskCommentId) === String(latestComment.id)) {
            console.log("Comment already synced, skipping");
            return;
          }

          if (latestComment.attachments && latestComment.attachments.length > 0) {
            const { relations, html } = await processZendeskAttachments(
              latestComment.attachments
            );
            attachmentRelations = relations;
            attachedHtml = html;
          }

          // Update last synced comment ID
          ticketSync.lastZendeskCommentId = String(latestComment.id);
          ticketSync.lastSyncSource = "zendesk";
          ticketSync.lastSyncedAt = new Date();
          await ticketSyncRepo.save(ticketSync);
        }
      } catch (err) {
        console.error("Error fetching/processing attachments:", err);
      }
    }

    formattedComment += attachedHtml;

    let commentText = "";
    if (user) {
      commentText = `
        <div>
          <b>From:</b> ${user.providerDisplayName}
          <br>
          ${formattedComment}
        </div>
      `;
    } else {
      commentText = `
        <div>
          <b>From Client</b>
          <br>
          ${formattedComment}
        </div>
      `;
    }

    const newAdoCommentId = await addADOComment(workItemId, commentText);

    if (newAdoCommentId) {
      ticketSync.lastADOCommentId = String(newAdoCommentId);
      await ticketSyncRepo.save(ticketSync);
    }

    // Add attachment relations if any
    if (attachmentRelations.length > 0) {
      const { attachFileToWorkItem } = await import("./azure.service.js");
      for (const relation of attachmentRelations) {
        await attachFileToWorkItem(
          workItemId,
          relation.value.url,
          relation.value.attributes.comment
        );
      }
    }
  }
};

/**
 * Sync Azure DevOps work item update to Zendesk
 * Handles status and comments
 */
export const syncADOToZendesk = async (
  workItemId: number,
  syncComments: boolean = true
): Promise<void> => {
  // Get ADO work item
  const adoWorkItem = await getADOWorkItem(workItemId);

  // Extract Zendesk ticket ID from tags
  const zendeskTicketId = getZendeskTicketIdFromADOWorkItem(adoWorkItem);
  if (!zendeskTicketId) {
    console.log(`No Zendesk ticket ID found in ADO work item ${workItemId}`);
    return;
  }

  // Get or create sync record
  const ticketSyncRepo = AppDataSource.getRepository(TicketSync);
  let ticketSync = await ticketSyncRepo.findOne({
    where: { azureWorkItemId: workItemId },
  });

  if (!ticketSync) {
    ticketSync = ticketSyncRepo.create({
      zendeskTicketId,
      azureWorkItemId: workItemId,
      lastSyncSource: "azure",
      lastSyncedAt: new Date(),
    });
    await ticketSyncRepo.save(ticketSync);
  }

  // Get current Zendesk ticket status to prevent unnecessary updates
  const zendeskTicket = await getZendeskTicket(zendeskTicketId);
  const currentZendeskStatus = zendeskTicket.status;

  // Sync status
  const adoState = adoWorkItem.fields["System.State"];
  const targetZendeskStatus = mapADOStateToZendesk(adoState);

  if (currentZendeskStatus !== targetZendeskStatus) {
    console.log(
      `Syncing status: ADO ${adoState} -> Zendesk ${targetZendeskStatus} (current: ${currentZendeskStatus})`
    );
    await updateZendeskTicketStatus(zendeskTicketId, targetZendeskStatus);
  }

  // Sync comments if requested
  if (syncComments) {
    try {
      const adoComments = await getADOComments(workItemId);
      const zendeskComments = await getZendeskComments(zendeskTicketId);

      // Find the latest ADO comment
      if (adoComments.length > 0) {
        // Sort comments by ID descending to guarantee we always grab the newest comment
        const sortedAdoComments = [...adoComments].sort((a, b) => Number(b.id) - Number(a.id));
        const latestADOComment = sortedAdoComments[0];

        // Loop prevention: If the ADO comment was created by our Zendesk sync, it will contain this signature
        if (latestADOComment.text.includes("From:") || latestADOComment.text.includes("Comment From Client")) {
          console.log("Loop prevention: Skipping ADO comment because it originated from Zendesk");
          return;
        }

        // Check if this comment has already been synced
        if (String(ticketSync.lastADOCommentId) === String(latestADOComment.id)) {
          console.log("ADO comment already synced, skipping");
          return;
        }

        // Check if this comment has already been synced to Zendesk
        // by comparing with the latest Zendesk comment
        const latestZendeskComment = zendeskComments.length > 0
          ? zendeskComments[zendeskComments.length - 1]
          : null;

        // Simple check: if the ADO comment text is not in the latest Zendesk comment, sync it
        const commentAlreadySynced = latestZendeskComment?.body?.includes(latestADOComment.text);

        if (!commentAlreadySynced && latestADOComment.text.trim()) {
          console.log(
            `Syncing ADO comment ${latestADOComment.id} to Zendesk ticket ${zendeskTicketId}`
          );

          const formattedComment = `
            <div>
              <b>From Developer</b>
              <br>
              ${latestADOComment.text.replace(/\n/g, "<br>")}
            </div>
          `;

          const result = await addZendeskComment(zendeskTicketId, formattedComment, false);

          // Bulletproof loop prevention: Save the newly created Zendesk comment ID
          // so that when the Zendesk webhook fires a second later, we instantly recognize and ignore it!
          if (result?.audit?.events) {
            const commentEvent = result.audit.events.find((e: any) => e.type === "Comment");
            if (commentEvent?.id) {
              ticketSync.lastZendeskCommentId = String(commentEvent.id);
            }
          }

          // Update last synced comment ID
          ticketSync.lastADOCommentId = String(latestADOComment.id);
          ticketSync.lastSyncSource = "azure";
          ticketSync.lastSyncedAt = new Date();
          await ticketSyncRepo.save(ticketSync);
        }
      }
    } catch (error) {
      console.error("Error syncing ADO comments to Zendesk:", error);
      // Don't throw - comment sync failure shouldn't break status sync
    }
  }
};

/**
 * Check if sync is needed by comparing current states
 */
export const isSyncNeeded = (
  sourceState: string,
  targetState: string,
  mappingFn: (state: string) => string
): boolean => {
  const mappedState = mappingFn(sourceState);
  return mappedState !== targetState;
};
