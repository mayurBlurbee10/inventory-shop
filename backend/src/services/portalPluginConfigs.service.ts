import "reflect-metadata";
import { type EntityTarget, type ObjectLiteral } from "typeorm";
import { getConnection } from "../config/db.ts";
import { InbuildPlugins } from "../entities/InbuildPlugins.ts";
import { PortalPluginConfigs } from "../entities/PortalPluginConfigs.ts";

const getRepository = async (entity: EntityTarget<ObjectLiteral>) => {
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPortalPluginConfig = async (data: any) => {
  const repository = await getRepository(PortalPluginConfigs);
  const pluginRepository = await getRepository(InbuildPlugins);
  
  try {
    // Check if plugin exists
    const plugin = await pluginRepository.findOne({
      where: { pluginKey: data.pluginKey }
    });
    if (!plugin) {
      throw new Error("Plugin not found.");
    }

    // Check if config already exists for this portal and plugin
    const existingConfig = await repository.findOne({
      where: { 
        portalId: data.portalId,
        pluginKey: data.pluginKey
      }
    });
    if (existingConfig) {
      throw new Error("Plugin configuration already exists for this portal.");
    }

    const config = repository.create(data);
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to create portal plugin configuration.");
  }
};

const getPortalPluginConfigs = async () => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    return await repository.find({
      relations: ["plugin"],
      order: {
        portalId: "ASC",
        pluginKey: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get portal plugin configurations.");
  }
};

const getPortalPluginConfigById = async (id: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { id },
      relations: ["plugin"]
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    return config;
  } catch (error) {
    throw new Error("Failed to get portal plugin configuration.");
  }
};

const getPortalPluginConfigsByPortal = async (portalId: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    return await repository.find({
      where: { portalId },
      relations: ["plugin"],
      order: {
        pluginKey: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get portal plugin configurations by portal.");
  }
};

const getPortalPluginConfigsByPlugin = async (pluginKey: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    return await repository.find({
      where: { pluginKey },
      relations: ["plugin"],
      order: {
        portalId: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get portal plugin configurations by plugin.");
  }
};

const getPortalPluginConfig = async (portalId: string, pluginKey: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      },
      relations: ["plugin"]
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    return config;
  } catch (error) {
    throw new Error("Failed to get portal plugin configuration.");
  }
};

const updatePortalPluginConfig = async (id: string, data: any) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { id }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    Object.assign(config, data);
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to update portal plugin configuration.");
  }
};

const updatePortalPluginConfigByPortalAndPlugin = async (portalId: string, pluginKey: string, data: any) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    Object.assign(config, data);
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to update portal plugin configuration.");
  }
};

const deletePortalPluginConfig = async (id: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { id }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    await repository.remove(config);
    return { message: "Portal plugin configuration deleted successfully." };
  } catch (error) {
    throw new Error("Failed to delete portal plugin configuration.");
  }
};

const deletePortalPluginConfigByPortalAndPlugin = async (portalId: string, pluginKey: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    await repository.remove(config);
    return { message: "Portal plugin configuration deleted successfully." };
  } catch (error) {
    throw new Error("Failed to delete portal plugin configuration.");
  }
};

const getEnabledPortalPluginConfigs = async (portalId?: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const whereCondition: any = { isEnabled: true };
    if (portalId) {
      whereCondition.portalId = portalId;
    }

    return await repository.find({
      where: whereCondition,
      relations: ["plugin"],
      order: {
        portalId: "ASC",
        pluginKey: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get enabled portal plugin configurations.");
  }
};

const togglePortalPluginStatus = async (portalId: string, pluginKey: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    config.isEnabled = !config.isEnabled;
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to toggle portal plugin status.");
  }
};

const incrementUsageCount = async (portalId: string, pluginKey: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    config.usageCount += 1;
    config.lastUsed = new Date();
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to increment usage count.");
  }
};

const incrementErrorCount = async (portalId: string, pluginKey: string, errorMessage?: string) => {
  const repository = await getRepository(PortalPluginConfigs);
  try {
    const config = await repository.findOne({
      where: { 
        portalId,
        pluginKey
      }
    });
    if (!config) {
      throw new Error("Portal plugin configuration not found.");
    }
    
    config.errorCount += 1;
    if (errorMessage) {
      config.lastError = errorMessage;
    }
    await repository.save(config);
    return config;
  } catch (error) {
    throw new Error("Failed to increment error count.");
  }
};

export default {
  createPortalPluginConfig,
  getPortalPluginConfigs,
  getPortalPluginConfigById,
  getPortalPluginConfigsByPortal,
  getPortalPluginConfigsByPlugin,
  getPortalPluginConfig,
  updatePortalPluginConfig,
  updatePortalPluginConfigByPortalAndPlugin,
  deletePortalPluginConfig,
  deletePortalPluginConfigByPortalAndPlugin,
  getEnabledPortalPluginConfigs,
  togglePortalPluginStatus,
  incrementUsageCount,
  incrementErrorCount
};
