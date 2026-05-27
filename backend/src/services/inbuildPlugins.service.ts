import "reflect-metadata";
import { type EntityTarget, type ObjectLiteral } from "typeorm";
import { getConnection } from "../config/db.ts";
import { InbuildPlugins } from "../entities/InbuildPlugins.ts";

const getRepository = async (entity: EntityTarget<ObjectLiteral>) => {
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createInbuildPlugin = async (data: any) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = repository.create(data);
    await repository.save(plugin);
    return plugin;
  } catch (error) {
    throw new Error("Failed to create inbuild plugin.");
  }
};

const getInbuildPlugins = async () => {
  const repository = await getRepository(InbuildPlugins);
  try {
    return await repository.find({
      order: {
        pluginName: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get inbuild plugins.");
  }
};

const getInbuildPluginById = async (id: string) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = await repository.findOne({
      where: { id }
    });
    if (!plugin) {
      throw new Error("Inbuild plugin not found.");
    }
    return plugin;
  } catch (error) {
    throw new Error("Failed to get inbuild plugin.");
  }
};

const getInbuildPluginByKey = async (pluginKey: string) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = await repository.findOne({
      where: { pluginKey }
    });
    if (!plugin) {
      throw new Error("Inbuild plugin not found.");
    }
    return plugin;
  } catch (error) {
    throw new Error("Failed to get inbuild plugin by key.");
  }
};

const updateInbuildPlugin = async (id: string, data: any) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = await repository.findOne({
      where: { id }
    });
    if (!plugin) {
      throw new Error("Inbuild plugin not found.");
    }
    
    Object.assign(plugin, data);
    await repository.save(plugin);
    return plugin;
  } catch (error) {
    throw new Error("Failed to update inbuild plugin.");
  }
};

const deleteInbuildPlugin = async (id: string) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = await repository.findOne({
      where: { id }
    });
    if (!plugin) {
      throw new Error("Inbuild plugin not found.");
    }
    
    await repository.remove(plugin);
    return { message: "Inbuild plugin deleted successfully." };
  } catch (error) {
    throw new Error("Failed to delete inbuild plugin.");
  }
};

const getActiveInbuildPlugins = async () => {
  const repository = await getRepository(InbuildPlugins);
  try {
    return await repository.find({
      where: { isActive: true },
      order: {
        pluginName: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get active inbuild plugins.");
  }
};

const getSystemPlugins = async () => {
  const repository = await getRepository(InbuildPlugins);
  try {
    return await repository.find({
      where: { isSystemPlugin: true },
      order: {
        pluginName: "ASC"
      }
    });
  } catch (error) {
    throw new Error("Failed to get system plugins.");
  }
};

const togglePluginStatus = async (id: string) => {
  const repository = await getRepository(InbuildPlugins);
  try {
    const plugin = await repository.findOne({
      where: { id }
    });
    if (!plugin) {
      throw new Error("Inbuild plugin not found.");
    }
    
    plugin.isActive = !plugin.isActive;
    await repository.save(plugin);
    return plugin;
  } catch (error) {
    throw new Error("Failed to toggle plugin status.");
  }
};

export default {
  createInbuildPlugin,
  getInbuildPlugins,
  getInbuildPluginById,
  getInbuildPluginByKey,
  updateInbuildPlugin,
  deleteInbuildPlugin,
  getActiveInbuildPlugins,
  getSystemPlugins,
  togglePluginStatus
};
