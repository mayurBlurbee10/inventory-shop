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
      papUrl,
      applicationId,
      applicationSecret,
      timeoutMs,
      papTimeoutMs,
      onPdpDown: failClosed ? "throw" : "deny",
    });
  }
  return client;
}

/** PAP email → group → role keys. Empty if email not found / PAP unavailable. */
export async function resolveRolesByEmail(
  email?: string | null
): Promise<string[]> {
  const normalized = String(email || "").trim();
  if (!normalized) return [];

  const { applicationSecret } = getConfig();
  const ac = getClient();
  if (!ac || !applicationSecret) return [];

  try {
    const resolved = await ac.resolveRolesByEmail(normalized);
    if (
      !resolved.found ||
      !Array.isArray(resolved.roles) ||
      !resolved.roles.length
    ) {
      return [];
    }
    return resolved.roles
      .map((r: { key?: string; name?: string }) =>
        String(r.key || r.name || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  } catch (err) {
    console.warn(
      "[accesscontrol] resolveRolesByEmail failed:",
      (err as Error).message
    );
    return [];
  }
}

export function collectAttributes(user: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const merge = (src: unknown) => {
    if (!src || typeof src !== "object" || Array.isArray(src)) return;
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (v == null || v === "") continue;
      out[k] = v;
    }
  };
  merge(user?.attributeValues);
  merge(user?.attributes);
  let extra = user?.extra;
  if (typeof extra === "string") {
    try {
      extra = JSON.parse(extra);
    } catch {
      extra = null;
    }
  }
  merge(extra);
  if (user?.family) out.family = user.family;
  return out;
}

export async function checkAccess(args: {
  email?: string;
  attributes?: Record<string, unknown>;
  resource: string;
  action: string;
}): Promise<{ allowed: boolean; reason: string }> {
  const { enforce, failClosed } = getConfig();
  if (!enforce) {
    return { allowed: true, reason: "AC_ENFORCE=false" };
  }
  if (!getClient()) {
    return { allowed: !failClosed, reason: "SDK not configured" };
  }
  try {
    const result = await getSeparatedPermissions({
      email: args.email,
      attributes: args.attributes || {},
    });
    const key = `${args.resource}.${args.action}`;
    const allowed = Boolean(result.permissions?.[key]);
    return {
      allowed,
      reason: allowed ? `Allowed ${key}` : `No grant for ${key}`,
    };
  } catch (err) {
    return {
      allowed: !failClosed,
      reason: (err as Error).message || "PDP error",
    };
  }
}

export async function checkManyAccess(args: {
  email?: string;
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
    const roles = await resolveRolesByEmail(args.email);
    if (!roles.length) {
      return Object.fromEntries(args.pairs.map((p) => [keyOf(p), false]));
    }
    return await ac.checkMany(
      {
        roles,
        roleIds: roles,
        attributes: args.attributes || {},
      },
      args.pairs
    );
  } catch (err) {
    console.warn("[accesscontrol] checkMany failed:", (err as Error).message);
    return Object.fromEntries(args.pairs.map((p) => [keyOf(p), !failClosed]));
  }
}

async function getRolePermissions(args: {
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
    return {
      permissions: {},
      roles: args.roles || [],
      meta: { reason: "SDK not configured" },
    };
  }
  if (!args.roles.length) {
    return {
      permissions: {},
      roles: [],
      meta: { reason: "User email not found in PAP" },
    };
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

/**
 * Permissions by email + attributes.
 * Email not in PAP → empty permissions.
 */
export async function getSeparatedPermissions(args: {
  email?: string;
  attributes?: Record<string, unknown>;
}): Promise<{
  permissions: Record<string, boolean>;
  roles: string[];
  meta?: Record<string, unknown>;
}> {
  const email = String(args.email || "").trim();
  const attributes = {
    ...(args.attributes || {}),
    ...(email ? { email } : {}),
  };
  const roles = await resolveRolesByEmail(email);
  return getRolePermissions({ roles, attributes });
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
