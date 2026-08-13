/**
 * Status mapping utilities for Zendesk ↔ Azure DevOps synchronization
 */

/**
 * Zendesk status to Azure DevOps state mapping
 * Based on client requirements:
 * - Zendesk Open → ADO Active
 * - Zendesk Pending → ADO Blocked
 * - Zendesk Solved → ADO Closed
 * - Zendesk Closed → ADO Closed
 */
export const zendeskToADOStateMap: Record<string, string> = {
  new: "New",
  open: "Active",
  pending: "Blocked",
  hold: "Blocked",
  solved: "Closed",
  closed: "Closed",
};

/**
 * Azure DevOps state to Zendesk status mapping
 * Based on client requirements:
 * - ADO New → Zendesk Open
 * - ADO Active → Zendesk Open
 * - ADO Blocked → Zendesk Pending
 * - ADO Closed → Zendesk Solved
 */
export const adoToZendeskStatusMap: Record<string, string> = {
  New: "open",
  Active: "open",
  Blocked: "pending",
  Closed: "solved",
};

/**
 * Convert Zendesk status to ADO state
 */
export const mapZendeskStatusToADO = (zendeskStatus: string): string => {
  return zendeskToADOStateMap[zendeskStatus.toLowerCase()] || "Active";
};

/**
 * Convert ADO state to Zendesk status
 */
export const mapADOStateToZendesk = (adoState: string): string => {
  return adoToZendeskStatusMap[adoState] || "open";
};
