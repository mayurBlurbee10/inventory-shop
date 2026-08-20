import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";
import * as boxService from "../services/box.service.ts";
import {
  createBoxAppUser as createBoxAppUserInternal,
  ensurePortalFolderStructure,
} from "../utils/boxCreateAppUser.ts";


const client = getBoxClient();

// POST /api/box/create-user
const createBoxAppUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const data = req.body;
      const {
        userName = "Test User",
        externalId = Date.now().toString(),
        portalId,
      } = data;

      let parentFolderId = "0";
      if (portalId && portalId !== "root") {
        const folders = await ensurePortalFolderStructure(portalId);
        parentFolderId = folders.userUploadsFolderId;
      }

      const user = await createBoxAppUserInternal({
        userName,
        externalId,
        parentFolderId,
        folderName: userName,
      });

      if (user?.folderId && user?.userId) {
        try {
          await boxService.addCollaborator(
            user.folderId,
            user.userId,
            "editor",
            "folder"
          );
        } catch (collabError: any) {
          const status =
            collabError?.statusCode || collabError?.response?.statusCode;
          if (status !== 409) {
            throw collabError;
          }
        }
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Error creating Box app user:", error);
      return res.status(500).json({
        error: (error as Error).message || "Failed to create Box user",
      });
    }
  }
);

// POST /api/box/create-user/bulk
const bulkCreateBoxUsers = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ error: "File not provided" });
      }

      const Papa = await import("papaparse");
      const fileData = file.buffer.toString("utf-8");

      const parsedCsv = (Papa as any).default.parse(fileData, {
        header: true,
        skipEmptyLines: true,
      });

      if (!Array.isArray(parsedCsv.data) || parsedCsv.data.length === 0) {
        return res.status(400).json({
          error: "Invalid or empty CSV file",
        });
      }

      const REQUIRED_HEADERS = ["email", "name", "title", "companyName", "role"];
      const headers = parsedCsv.meta.fields;
      const missingHeaders = REQUIRED_HEADERS.filter(
        (header) => !headers?.includes(header)
      );

      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: "Missing required headers.",
          missingHeaders,
        });
      }

      const userService = (await import("../services/user.service.ts")).default;
      const users = await userService.getUsers();
      const createdUsers: any[] = [];
      const errors: any[] = [];

      for (const row of parsedCsv.data as any[]) {
        const { email, name, title, companyName, role } = row;

        if (!email || !name || !role) {
          errors.push({ row, error: "Missing required fields" });
          continue;
        }

        if ((users as any[]).some((user: any) => user.email === email)) {
          errors.push({ email, error: "User already exists" });
          continue;
        }

        try {
          const appUser = await client.users.createUser({
            name: name,
            externalAppUserId: email,
            isPlatformAccessOnly: true,
          });

          const folder = await client.folders.createFolder({
            name: `${appUser.name}'s Files`,
            parent: { id: "0" },
          });

          await client.userCollaborations.createCollaboration({
            item: {
              id: folder?.id,
              type: "folder",
            },
            accessibleBy: {
              type: "user",
              id: appUser?.id,
            },
            role: "editor",
          });

          const newUser = {
            id: Date.now().toString(),
            email,
            name,
            title,
            companyName,
            role,
            password: "000",
            boxUserId: appUser.id || "000",
            folderId: folder.id || "000",
            createdAt: new Date().toISOString(),
          };

          createdUsers.push(newUser);
        } catch (error) {
          console.error("Error processing user:", email, (error as Error).message);
          errors.push({ email, error: (error as Error).message });
        }
      }

      return res.status(200).json({
        success: true,
        createdUsers,
        errors,
      });
    } catch (error) {
      console.error("Error creating Box app user:", error);
      return res.status(500).json({
        error: (error as Error).message || "Failed to create Box user",
      });
    }
  }
);

export default {
  createBoxAppUser,
  bulkCreateBoxUsers,
};

