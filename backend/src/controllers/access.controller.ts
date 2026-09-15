import type { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";
import { getSeparatedPermissions } from "../utils/accesscontrol.ts";

// TODO: replace with real profile attrs — temporary ABAC test values
export const accessTestAttributes: Record<string, unknown> = {
  // gender: "Male",
  // experience: 10,
  // department: "IT",
  // family: "relative",
};

const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const email = user?.email;
  const attributes = {
    ...accessTestAttributes,
    ...(email ? { email } : {}),
  };
  const result = await getSeparatedPermissions({ email, attributes });
  return res.status(200).json({
    roles: result.roles || [],
    permissions: result.permissions || {},
    meta: result.meta,
  });
});

export default { getPermissions };
