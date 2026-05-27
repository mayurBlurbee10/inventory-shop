import { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";
import { logApiCall } from "../utils/api-log-middleware.ts";
import inbuildPluginsService from "../services/inbuildPlugins.service.ts";

const createInbuildPlugin = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const plugin = await inbuildPluginsService.createInbuildPlugin(req.body);
    return res.status(201).json({
      success: true,
      message: "Plugin created successfully.",
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to create inbuild plugin.",
      details: (error as Error).message,
    });
  }
};

const getInbuildPlugins = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { searchParams } = new URL(
      req.url,
      `${req.protocol}://${req.headers.host}`
    );
    const pluginKey = searchParams.get("pluginKey");
    const active = searchParams.get("active");
    const systemPlugin = searchParams.get("systemPlugin");

    let plugins;
    if (pluginKey) {
      plugins = await inbuildPluginsService.getInbuildPluginByKey(pluginKey);
    } else if (active === "true") {
      plugins = await inbuildPluginsService.getActiveInbuildPlugins();
    } else if (systemPlugin === "true") {
      plugins = await inbuildPluginsService.getSystemPlugins();
    } else {
      plugins = await inbuildPluginsService.getInbuildPlugins();
    }

    return res.status(200).json({
      success: true,
      message: "Plugins fetched successfully.",
      data: plugins,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch inbuild plugins.",
      details: (error as Error).message,
    });
  }
};

const getInbuildPluginById = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const plugin = await inbuildPluginsService.getInbuildPluginById(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: "Plugin not found.",
        message: "The requested plugin does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plugin fetched successfully.",
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch inbuild plugin.",
      details: (error as Error).message,
    });
  }
};

const updateInbuildPlugin = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const plugin = await inbuildPluginsService.updateInbuildPlugin(id, req.body);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: "Plugin not found.",
        message: "The requested plugin does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plugin updated successfully.",
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to update inbuild plugin.",
      details: (error as Error).message,
    });
  }
};

const deleteInbuildPlugin = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const result = await inbuildPluginsService.deleteInbuildPlugin(id);
    
    return res.status(200).json({
      success: true,
      message: "Plugin deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete inbuild plugin.",
      details: (error as Error).message,
    });
  }
};

const togglePluginStatus = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const plugin = await inbuildPluginsService.togglePluginStatus(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: "Plugin not found.",
        message: "The requested plugin does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Plugin ${plugin.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to toggle plugin status.",
      details: (error as Error).message,
    });
  }
};

export default {
  createInbuildPlugin: asyncHandler(createInbuildPlugin),
  getInbuildPlugins: asyncHandler(getInbuildPlugins),
  getInbuildPluginById: asyncHandler(getInbuildPluginById),
  updateInbuildPlugin: asyncHandler(updateInbuildPlugin),
  deleteInbuildPlugin: asyncHandler(deleteInbuildPlugin),
  togglePluginStatus: asyncHandler(togglePluginStatus)
};
