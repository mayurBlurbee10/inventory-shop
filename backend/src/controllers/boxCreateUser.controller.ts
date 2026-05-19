import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";
import * as boxService from "../services/box.service.ts";

const client = getBoxClient();

// POST /api/box/create-user
const createBoxAppUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const data = req.body;
      const { userName = "Test User", externalId = Date.now().toString() } =
        data;

      const user = await boxService.createBoxAppUser({ userName, externalId });

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

      // @ts-expect-error - papaparse doesn't have type definitions
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
          const appUser = await client.enterprise.addAppUser(name, {
            external_app_user_id: email,
            is_platform_access_only: true,
          });

          const folder = await client.folders.create(
            "0",
            `${appUser.name}'s Files`
          );

          await client.collaborations.createWithUserID(
            appUser.id,
            folder.id,
            (client as any).collaborationRoles.EDITOR
          );

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

