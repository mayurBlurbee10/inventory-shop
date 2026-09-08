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
} from "./zendesk.service.js";
import {
  getADOWorkItem,
  updateADOStatus,
  addADOComment,
  getADOUserByEmail,
  getZendeskTicketIdFromADOWorkItem,
  getADOComments,
} from "./azure.service.js";
import { processZendeskAttachments } from "./attachment.service.js";
import { mapZendeskStatusToADO, mapADOStateToZendesk } from "../utils/statusMapping.js";

/**
 * Normalize text for HTML/plain string comparison by removing HTML tags, entities, and excess whitespace
 */
export const normalizeCommentText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

/**
 * Normalize Zendesk/ADO comment text for HTML rendering.
 * Zendesk plain text often contains extra/trailing newlines that are collapsed in
 * Zendesk UI but become large empty gaps in ADO when each `\n` is turned into `<br>`.
 */
const formatCommentHtml = (comment: string): string => {
  if (!comment) return "";

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(comment);

  if (looksLikeHtml) {
    return comment
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/>\s+</g, "><")
      .replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br>")
      .replace(/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+/gi, "")
      .replace(/(?:<div>(?:\s|&nbsp;|<br\s*\/?>)*<\/div>\s*)+/gi, "")
      .replace(/(?:<br\s*\/?>\s*)+$/gi, "")
      .replace(/^(?:<br\s*\/?>\s*)+/gi, "")
      .trim();
  }

  return comment
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .replace(/\n{2,}/g, "\n")
    .replace(/\n/g, "<br>");
};

/**
 * Atomic claim for ADO comment sync to prevent concurrent execution duplicate comments
 */
const tryClaimADOCommentSync = async (
  ticketSyncId: string,
  adoCommentId: string
): Promise<{ claimed: boolean; previousLastADOCommentId: string | null }> => {
  const ticketSyncRepo = AppDataSource.getRepository(TicketSync);
  const record = await ticketSyncRepo.findOne({ where: { id: ticketSyncId } });
  if (!record) return { claimed: false, previousLastADOCommentId: null };

  if (String(record.lastADOCommentId) === String(adoCommentId)) {
    return { claimed: false, previousLastADOCommentId: record.lastADOCommentId };
  }

  const previousLastADOCommentId = record.lastADOCommentId;
  record.lastADOCommentId = String(adoCommentId);
  record.lastSyncedAt = new Date();
  record.lastSyncSource = "azure";
  await ticketSyncRepo.save(record);

  return { claimed: true, previousLastADOCommentId };
};

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
  const { ticket_id, azure_work_item_id, status, assignee_email } = payload;

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

  // Fetch comments directly from Zendesk API (do NOT rely on payload.comment)
  if (!ticket_id) return;

  let comments: any[] = [];
  try {
    comments = await getZendeskComments(ticket_id);
  } catch (err) {
    console.error("Error fetching Zendesk comments:", err);
    return;
  }

  if (!comments || comments.length === 0) {
    return;
  }

  const firstComment = comments[0];
  const firstCommentId = String(firstComment.id);
  const latestComment = comments[comments.length - 1];
  const latestCommentId = String(latestComment.id);

  // Always ensure lastZendeskCommentId is initialized (at minimum to firstCommentId - the ticket description)
  if (!ticketSync.lastZendeskCommentId) {
    ticketSync.lastZendeskCommentId = firstCommentId;
    await ticketSyncRepo.save(ticketSync);
  }

  // 1. Skip if latest comment has already been synced
  if (String(ticketSync.lastZendeskCommentId) === latestCommentId) {
    console.log(`Zendesk comment ${latestCommentId} already synced, skipping`);
    return;
  }

  // 2. Skip if latest comment is the first comment (initial ticket description)
  if (latestCommentId === firstCommentId) {
    console.log(`Skipping Zendesk comment ${latestCommentId} because it is the initial ticket description (first comment)`);
    ticketSync.lastZendeskCommentId = firstCommentId;
    ticketSync.lastSyncSource = "zendesk";
    ticketSync.lastSyncedAt = new Date();
    await ticketSyncRepo.save(ticketSync);
    return;
  }

  // Fetch Zendesk ticket to check description text if needed
  let zendeskTicket: any = null;
  try {
    zendeskTicket = await getZendeskTicket(ticket_id);
  } catch (e) {
    console.error("Error fetching Zendesk ticket details:", e);
  }

  // 3. Skip if latest comment text matches initial ticket description
  const normLatestBody = normalizeCommentText(latestComment.body || latestComment.html_body);
  const normPayloadComment = normalizeCommentText(payload.comment);
  const normTicketDesc = normalizeCommentText(zendeskTicket?.description);
  const normFirstBody = normalizeCommentText(firstComment.body || firstComment.html_body);

  const isDescriptionMatch =
    (normTicketDesc && (normLatestBody === normTicketDesc || normPayloadComment === normTicketDesc || normLatestBody.includes(normTicketDesc))) ||
    (normFirstBody && (normLatestBody === normFirstBody || normPayloadComment === normFirstBody || normLatestBody.includes(normFirstBody)));

  if (isDescriptionMatch) {
    console.log(`Skipping Zendesk comment ${latestCommentId} because text matches initial ticket description`);
    ticketSync.lastZendeskCommentId = latestCommentId;
    ticketSync.lastSyncSource = "zendesk";
    ticketSync.lastSyncedAt = new Date();
    await ticketSyncRepo.save(ticketSync);
    return;
  }

  // 4. Skip comments containing "From Developer" (ADO-originated)
  const isFromDeveloper =
    (latestComment.body && latestComment.body.includes("From Developer")) ||
    (latestComment.html_body && latestComment.html_body.includes("From Developer"));

  if (isFromDeveloper) {
    console.log(`Loop prevention: Skipping Zendesk comment ${latestCommentId} because it originated from ADO ("From Developer")`);
    ticketSync.lastZendeskCommentId = latestCommentId;
    ticketSync.lastSyncSource = "zendesk";
    ticketSync.lastSyncedAt = new Date();
    await ticketSyncRepo.save(ticketSync);
    return;
  }

  // Process attachments on latestComment
  let attachedHtml = "";
  let attachmentRelations: any[] = [];
  if (latestComment.attachments && latestComment.attachments.length > 0) {
    try {
      const { relations, html } = await processZendeskAttachments(latestComment.attachments);
      attachmentRelations = relations;
      attachedHtml = html;
    } catch (err) {
      console.error("Error processing Zendesk comment attachments:", err);
    }
  }

  // Mark comment as synced in ticketSync before sending to ADO
  ticketSync.lastZendeskCommentId = latestCommentId;
  ticketSync.lastSyncSource = "zendesk";
  ticketSync.lastSyncedAt = new Date();
  await ticketSyncRepo.save(ticketSync);

  // Format comment
  const rawCommentText =
    latestComment.plain_body ||
    latestComment.body ||
    latestComment.html_body ||
    "";
  const formattedComment = formatCommentHtml(rawCommentText + attachedHtml);

  const user = assignee_email ? await getADOUserByEmail(assignee_email) : null;
  const commentText = user
    ? `<div><b>From:</b> ${user.providerDisplayName}<br>${formattedComment}</div>`
    : `<div><b>From Client</b><br>${formattedComment}</div>`;

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

      if (adoComments && adoComments.length > 0) {
        // Sort comments by ID descending to guarantee we always grab the newest comment
        const sortedAdoComments = [...adoComments].sort((a, b) => Number(b.id) - Number(a.id));
        const latestADOComment = sortedAdoComments[0];

        const adoText = latestADOComment.text || "";

        // Loop prevention: If the ADO comment was created by our Zendesk sync, it will contain this signature
        if (
          adoText.includes("From Client") ||
          adoText.includes("<b>From:</b>") ||
          adoText.includes("From:") ||
          adoText.includes("Comment From Client")
        ) {
          console.log("Loop prevention: Skipping ADO comment because it originated from Zendesk");
          return;
        }

        // Check if this comment has already been claimed/synced
        if (String(ticketSync.lastADOCommentId) === String(latestADOComment.id)) {
          console.log("ADO comment already synced, skipping");
          return;
        }

        // Duplicate check: scan all Zendesk comments for "From Developer" + matching normalized comment text
        const normAdoText = normalizeCommentText(adoText);
        const duplicateInZendesk = zendeskComments.some((zComment) => {
          const zBody = zComment.body || zComment.html_body || "";
          return (
            zBody.includes("From Developer") &&
            normalizeCommentText(zBody).includes(normAdoText)
          );
        });

        if (duplicateInZendesk) {
          console.log(`Duplicate comment detected in Zendesk for ADO comment ${latestADOComment.id}, marking synced`);
          ticketSync.lastADOCommentId = String(latestADOComment.id);
          ticketSync.lastSyncSource = "azure";
          ticketSync.lastSyncedAt = new Date();
          await ticketSyncRepo.save(ticketSync);
          return;
        }

        if (adoText.trim()) {
          // Atomic claim before posting
          const claim = await tryClaimADOCommentSync(ticketSync.id, String(latestADOComment.id));
          if (!claim.claimed) {
            console.log(`ADO comment ${latestADOComment.id} was already claimed by another process, skipping`);
            return;
          }

          console.log(
            `Syncing ADO comment ${latestADOComment.id} to Zendesk ticket ${zendeskTicketId}`
          );

          const formattedComment = `<div><b>From Developer</b><br>${formatCommentHtml(adoText)}</div>`;

          try {
            const result = await addZendeskComment(zendeskTicketId, formattedComment, false);

            if (result?.audit?.events) {
              const commentEvent = result.audit.events.find((e: any) => e.type === "Comment");
              if (commentEvent?.id) {
                ticketSync.lastZendeskCommentId = String(commentEvent.id);
                await ticketSyncRepo.save(ticketSync);
              }
            }
          } catch (postErr) {
            console.error("Failed to post comment to Zendesk, reverting lastADOCommentId claim:", postErr);
            // Revert claim on failure
            ticketSync.lastADOCommentId = claim.previousLastADOCommentId;
            await ticketSyncRepo.save(ticketSync);
            throw postErr;
          }
        }
      }
    } catch (error) {
      console.error("Error syncing ADO comments to Zendesk:", error);
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
