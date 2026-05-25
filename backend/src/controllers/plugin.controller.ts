import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import pluginService from "../services/plugin.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const getPlugins = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId, type } = req.query;

    let pluginExist;
    if (portalId && type) {
      pluginExist = await pluginService.getPluginByTypeAndPortal(
        type as string,
        portalId as string
      );
    } else if (portalId) {
      pluginExist = await pluginService.getPluginByPortalId(portalId as string);
    } else {
      pluginExist = await pluginService.getAllPlugins();
    }
    console.log("pluginExist: ", pluginExist);

    return res.status(200).json({
      message: `Plugin fetched successfully.`,
      data: pluginExist || [],
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to get plugin for ${req.query.portalId}.`,
      details: (error as Error).message,
    });
  }
});

const createPlugin = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    console.log("data: ", data);

    if (!data.type) {
      return res.status(400).json({
        error: "type and page are required fields",
      });
    }

    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      data.type,
      data.portalId
    );
    console.log("pluginExist: ", pluginExist);

    const matchingPlugin = pluginExist.find(
      (plugin: any) => plugin.type === data.type
    );

    if (matchingPlugin) {
      const pluginUpdate = await pluginService.updatePlugin(
        matchingPlugin.id,
        data
      );
      return res.status(200).json({
        message: `Plugin updated successfully.`,
        data: pluginUpdate,
      });
    }

    const plugin = await pluginService.createPlugin(data);
    console.log("plugin post: ", plugin);

    return res.status(200).json({
      message: `Plugin created successfully.`,
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to create plugin for ${req.body.type} in ${req.body.portalId}.`,
      details: (error as Error).message,
    });
  }
});

const updatePlugin = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    console.log("data: ", data);

    if (!data.type || !data.pageId) {
      return res.status(400).json({
        error: "type and page are required field",
      });
    }

    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      data.type,
      data.portalId
    );
    console.log("pluginExist: ", pluginExist);
    if (!pluginExist || pluginExist.length === 0) {
      return res.status(409).json({
        error: `${data.type} plugin doesn't exists.`,
      });
    }
    const plugin = await pluginService.updatePlugin(pluginExist[0].id, data);
    console.log("plugin post: ", plugin);

    return res.status(200).json({
      message: `plugin updated successfully.`,
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to update plugin for ${req.body.type} in ${req.body.portalId}.`,
      details: (error as Error).message,
    });
  }
});

const deletePlugin = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { id } = req.body;

    const pluginExist = await pluginService.getPluginById(id);
    console.log("pluginExist: ", pluginExist);

    if (!pluginExist) {
      return res.status(409).json({
        error: `plugin doesn't exist.`,
      });
    }

    await pluginService.deletePlugin(pluginExist.id);
    console.log(`plugin deleted successfully.`);

    return res.status(200).json({
      message: `plugin deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to delete plugin.`,
      details: (error as Error).message,
    });
  }
});

export default {
  getPlugins,
  createPlugin,
  updatePlugin,
  deletePlugin,
};

