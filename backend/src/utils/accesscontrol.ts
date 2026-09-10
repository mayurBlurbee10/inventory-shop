import { create } from "@accesscontroll/sdk";
type AccessControlClient = ReturnType<typeof create>;
let client: AccessControlClient | null = null;
function envFlag(name: string) {
  return (process.env[name] || "").trim() === "true";
}
function envStr(name: string, fallback = "") {
  return (process.env[name] || fallback).trim();
}
function getConfig() {
  return {
    enforce: envFlag("AC_ENFORCE"),
    failClosed: envFlag("AC_FAIL_CLOSED"),
    applicationId: envStr("AC_APPLICATION_ID"),
    applicationSecret: envStr("AC_APPLICATION_SECRET"),
    pdpUrl: envStr("AC_PDP_URL", "http://127.0.0.1:8181").replace(/\/$/, ""),
    papUrl: envStr("AC_PAP_URL", "http://127.0.0.1:8081").replace(/\/$/, ""),
    timeoutMs: Number(envStr("AC_TIMEOUT_MS", "2000")),
    papTimeoutMs: Number(envStr("AC_PAP_TIMEOUT_MS", "15000")),
  };
}
function getClient() {
  const {
    applicationId,
    applicationSecret,
    pdpUrl,
    papUrl,
    failClosed,
    timeoutMs,
    papTimeoutMs,
  } = getConfig();
  if (!applicationId) {
    console.warn("[accesscontrol] AC_APPLICATION_ID missing");
    return null;
  }
  if (!client) {
    client = create({
      pdpUrl,
      papUrl, // not necessary to pass this parameter
      applicationId,
      applicationSecret,
      timeoutMs,
      papTimeoutMs,
      onPdpDown: failClosed ? "throw" : "deny",
    });
  }
  return client;
}
export function collectRoles(user: any): string[] {
  const roles = new Set<string>();
  const push = (raw: unknown) => {
    if (raw == null || raw === "") return;
    roles.add(String(raw).trim().toLowerCase());
  };
  push(user?.role);
  if (Array.isArray(user?.roles)) {
    for (const r of user.roles) {
      push(typeof r === "string" ? r : r?.key || r?.name || r?.id);
    }
  }
  if (Array.isArray(user?.permissions)) {
    for (const p of user.permissions) push(p?.role);
  }
  return [...roles];
}
export async function checkAccess(args: {
  roles: string[];
  attributes?: Record<string, unknown>;
  resource: string;
  action: string;
}): Promise<{ allowed: boolean; reason: string }> {
  const { enforce, failClosed } = getConfig();
  if (!enforce) {
    return { allowed: true, reason: "AC_ENFORCE=false" };
  }
  const ac = getClient();
  if (!ac) {
    return { allowed: !failClosed, reason: "SDK not configured" };
  }
  try {
    const includeAbac = envFlag("AC_INCLUDE_ABAC");
    const result = await ac.check({
      user: {
        roles: args.roles,
        roleIds: args.roles,
        attributes: args.attributes || {},
      },
      resource: args.resource,
      action: args.action,
      // Older linked SDKs only forward `context` to PDP — not top-level includeAbac.
      context: { includeAbac },
      includeAbac,
    } as Parameters<NonNullable<typeof ac>["check"]>[0]);
    return { allowed: result.allowed, reason: result.reason };
  } catch (err) {
    return {
      allowed: !failClosed,
      reason: (err as Error).message || "PDP error",
    };
  }
}
export async function checkManyAccess(args: {
  roles: string[];
  attributes?: Record<string, unknown>;
  pairs: Array<{ resource: string; action: string; key?: string }>;
}): Promise<Record<string, boolean>> {
  const { enforce, failClosed } = getConfig();
  const keyOf = (p: { resource: string; action: string; key?: string }) =>
    p.key || `${p.resource}.${p.action}`;
  if (!enforce) {
    return Object.fromEntries(args.pairs.map((p) => [keyOf(p), true]));
  }
  const ac = getClient();
  if (!ac) {
    return Object.fromEntries(args.pairs.map((p) => [keyOf(p), !failClosed]));
  }
  try {
    return await ac.checkMany(
      {
        roles: args.roles,
        roleIds: args.roles,
        attributes: args.attributes || {},
      },
      args.pairs
    );
  } catch (err) {
    console.warn("[accesscontrol] checkMany failed:", (err as Error).message);
    return Object.fromEntries(args.pairs.map((p) => [keyOf(p), !failClosed]));
  }
}

/**
 * Full grant map for the user's roles from the published PDP bundle.
 * Prefer this for UI gating over checkManyAccess + fixed pair lists.
 */
export async function getRolePermissions(args: {
  roles: string[];
  attributes?: Record<string, unknown>;
}): Promise<{
  permissions: Record<string, boolean>;
  roles: string[];
  meta?: Record<string, unknown>;
}> {
  const { failClosed } = getConfig();
  const ac = getClient();
  if (!ac) {
    return { permissions: {}, roles: args.roles || [], meta: { reason: "SDK not configured" } };
  }
  try {
    const result = await ac.getPermissions({
      roles: args.roles,
      roleIds: args.roles,
      attributes: args.attributes || {},
    });
    return {
      permissions: result.permissions || {},
      roles: result.roles?.length ? result.roles : args.roles,
      meta: result.meta,
    };
  } catch (err) {
    console.warn(
      "[accesscontrol] getPermissions failed:",
      (err as Error).message
    );
    return {
      permissions: {},
      roles: args.roles || [],
      meta: {
        reason: (err as Error).message,
        failClosed,
      },
    };
  }
}

export async function registerUserInRbac(args: {
  name: string;
  email: string;
  role: string;
  externalId?: string;
  department?: string;
  attributes?: Record<string, number | string | boolean>;
}) {
  const { applicationSecret } = getConfig();
  const ac = getClient();
  if (!ac) return null;
  if (!applicationSecret) {
    console.warn(
      "[accesscontrol] AC_APPLICATION_SECRET missing — skipped registerUser"
    );
    return null;
  }
  try {
    return await ac.registerUser({
      name: args.name,
      email: args.email,
      externalId: args.externalId,
      department: args.department,
      attributeValues: args.attributes,
      role: args.role,
    });
  } catch (err) {
    console.warn(
      "[accesscontrol] registerUser failed:",
      (err as Error).message
    );
    return null;
  }
}
export async function removeUserFromRbac(args: {
  email?: string;
  externalId?: string;
  id?: string;
}) {
  const { applicationSecret } = getConfig();
  const ac = getClient();
  if (!ac) return null;
  if (!applicationSecret) {
    console.warn(
      "[accesscontrol] AC_APPLICATION_SECRET missing — skipped removeUser"
    );
    return null;
  }
  try {
    return await ac.removeUser(args);
  } catch (err) {
    console.warn("[accesscontrol] removeUser failed:", (err as Error).message);
    return null;
  }
}
export function isAccessControlEnforced() {
  return getConfig().enforce;
}