import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { asyncHandler } from "../utils/helper.ts";
import themeService from "../services/theme.service.ts";
import { UserRole } from "../config/constants.ts";

const canEditPortalTheme = (user: any, portalId: string): boolean => {
  if (!user) return false;

  if (user.role !== UserRole.USER) {
    return true;
  }

  if (user.role === UserRole.ADMIN) {
    if (!portalId || portalId === "root") return true;
    return user.portalId === portalId;
  }

  return false;
};

const getTheme = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId } = req.query;

    if (!portalId) {
      return res.status(400).json({
        error: "portalId is required.",
      });
    }

    const theme = await themeService.getThemeForPortal(portalId as string);

    if (!theme) {
      return res.status(200).json({
        message: "No portal theme configured.",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Theme retrieved successfully.",
      data: theme,
    });
  } catch (error) {
    console.error("Error fetching theme:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve theme.",
      details: (error as Error).message,
    });
  }
});

const createTheme = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { theme, themeType, portalId } = req.body;
    const user = (req as any).user;

    if (!theme || !themeType || !portalId) {
      return res.status(400).json({
        error: "theme, themeType, and portalId are required.",
      });
    }

    if (!canEditPortalTheme(user, portalId)) {
      return res.status(403).json({
        error: "Only portal admins can change the theme.",
      });
    }

    const savedTheme = await themeService.savePortalTheme({
      theme,
      themeType,
      portalId,
    });

    return res.status(200).json({
      message: "Portal theme saved successfully.",
      data: savedTheme,
    });
  } catch (error) {
    console.error("Error saving theme:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to save theme.",
      details: (error as Error).message,
    });
  }
});

export default {
  getTheme,
  createTheme,
};
