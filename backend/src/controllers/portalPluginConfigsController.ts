import { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";
import { logApiCall } from "../utils/api-log-middleware.ts";
import portalPluginConfigsService from "../services/portalPluginConfigs.service.ts";

const createPortalPluginConfig = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const config = await portalPluginConfigsService.createPortalPluginConfig(req.body);
    return res.status(201).json({
      success: true,
      message: "Portal plugin configuration created successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to create portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const getPortalPluginConfigs = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { searchParams } = new URL(
      req.url,
      `${req.protocol}://${req.headers.host}`
    );
    const portalId = searchParams.get("portalId");
    const pluginKey = searchParams.get("pluginKey");
    const enabled = searchParams.get("enabled");

    let configs;
    if (portalId && pluginKey) {
      configs = await portalPluginConfigsService.getPortalPluginConfig(portalId, pluginKey);
    } else if (portalId) {
      configs = await portalPluginConfigsService.getPortalPluginConfigsByPortal(portalId);
    } else if (pluginKey) {
      configs = await portalPluginConfigsService.getPortalPluginConfigsByPlugin(pluginKey);
    } else if (enabled === "true") {
      configs = await portalPluginConfigsService.getEnabledPortalPluginConfigs(portalId || undefined);
    } else {
      configs = await portalPluginConfigsService.getPortalPluginConfigs();
    }

    return res.status(200).json({
      success: true,
      message: "Portal plugin configurations fetched successfully.",
      data: configs,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch portal plugin configurations.",
      details: (error as Error).message,
    });
  }
};

const getPortalPluginConfigById = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const config = await portalPluginConfigsService.getPortalPluginConfigById(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Portal plugin configuration fetched successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const updatePortalPluginConfig = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const config = await portalPluginConfigsService.updatePortalPluginConfig(id, req.body);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Portal plugin configuration updated successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to update portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const updatePortalPluginConfigByPortalAndPlugin = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { portalId, pluginKey } = req.params;
    const config = await portalPluginConfigsService.updatePortalPluginConfigByPortalAndPlugin(
      portalId, 
      pluginKey, 
      req.body
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Portal plugin configuration updated successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to update portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const deletePortalPluginConfig = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { id } = req.params;
    const result = await portalPluginConfigsService.deletePortalPluginConfig(id);
    
    return res.status(200).json({
      success: true,
      message: "Portal plugin configuration deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const deletePortalPluginConfigByPortalAndPlugin = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { portalId, pluginKey } = req.params;
    const result = await portalPluginConfigsService.deletePortalPluginConfigByPortalAndPlugin(
      portalId, 
      pluginKey
    );
    
    return res.status(200).json({
      success: true,
      message: "Portal plugin configuration deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete portal plugin configuration.",
      details: (error as Error).message,
    });
  }
};

const togglePortalPluginStatus = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { portalId, pluginKey } = req.params;
    const config = await portalPluginConfigsService.togglePortalPluginStatus(portalId, pluginKey);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Portal plugin ${config.isEnabled ? 'enabled' : 'disabled'} successfully.`,
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to toggle portal plugin status.",
      details: (error as Error).message,
    });
  }
};

const incrementUsageCount = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { portalId, pluginKey } = req.params;
    const config = await portalPluginConfigsService.incrementUsageCount(portalId, pluginKey);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Usage count incremented successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to increment usage count.",
      details: (error as Error).message,
    });
  }
};

const incrementErrorCount = async (req: Request, res: Response) => {
  await logApiCall(req);
  try {
    const { portalId, pluginKey } = req.params;
    const { errorMessage } = req.body;
    const config = await portalPluginConfigsService.incrementErrorCount(
      portalId, 
      pluginKey, 
      errorMessage
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found.",
        message: "The requested portal plugin configuration does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Error count incremented successfully.",
      data: config,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Failed to increment error count.",
      details: (error as Error).message,
    });
  }
};

export default {
  createPortalPluginConfig: asyncHandler(createPortalPluginConfig),
  getPortalPluginConfigs: asyncHandler(getPortalPluginConfigs),
  getPortalPluginConfigById: asyncHandler(getPortalPluginConfigById),
  updatePortalPluginConfig: asyncHandler(updatePortalPluginConfig),
  updatePortalPluginConfigByPortalAndPlugin: asyncHandler(updatePortalPluginConfigByPortalAndPlugin),
  deletePortalPluginConfig: asyncHandler(deletePortalPluginConfig),
  deletePortalPluginConfigByPortalAndPlugin: asyncHandler(deletePortalPluginConfigByPortalAndPlugin),
  togglePortalPluginStatus: asyncHandler(togglePortalPluginStatus),
  incrementUsageCount: asyncHandler(incrementUsageCount),
  incrementErrorCount: asyncHandler(incrementErrorCount)
};
