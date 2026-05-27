import { Request, Response, NextFunction } from "express";
import { getBoxClient } from "./boxClient.js";
import { CollaborationRoleField } from "box-node-sdk/lib/schemas";

const client = getBoxClient();
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
export const sanitizeName = (name: string) => {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
};

export const addCollaborator = async (
  itemId: string,
  userID: string,
  role: CollaborationRoleField,
  type: "file" | "folder"
) => {
  const collaboration = await client.userCollaborations.createCollaboration(
    {
      accessibleBy: { id: userID, type: "user" },
      item: { id: itemId, type },
      role,
    },
    {
      queryParams: {
        notify: false,
      },
    }
  );
  return collaboration;
};