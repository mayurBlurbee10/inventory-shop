import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Plugins } from "../entities/Plugins.ts";
import { Pages } from "../entities/Pages.ts";
import { In } from "typeorm";
import { PluginType } from "../config/constants.ts";
import { tncPage } from "../utils/data/existingPages.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPlugin = async (data: any) => {
  const pluginRepository = await getRepository(Plugins);
  const pageRepository = await getRepository(Pages);
  try {
    const plugin = pluginRepository.create({
      type: data.type,
      portalId: data.portalId,
      createdBy: data.createdBy,
    });
    console.log("plugin", plugin);
    await pluginRepository.save(plugin);

    if (Array.isArray(data.pageId)) {
      const pages = await pageRepository.findBy({ id: In(data.pageId) });
      const missingIds = data.pageId.filter(
        (id: any) => !pages.some((page: any) => page.id === id)
      );
      if (missingIds.length > 0) {
        throw new Error(
          `The following page IDs do not exist: ${missingIds.join(", ")}`
        );
      }
      for (const page of pages) {
        page.plugin = plugin;
      }
      await pageRepository.save(pages);
    }
    return plugin;
  } catch (error) {
    throw new Error("Failed to create plugin.");
  }
};

const getPluginByTypeAndPortal = async (pluginType: string, portalId: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugins = await pluginRepository.find({
      where: {
        type: pluginType,
        portalId: portalId,
      },
      relations: ["pages"],
    });
    return plugins;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const getPluginByPortalId = async (portalId: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugins = await pluginRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["pages"],
    });
    return plugins;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const getAllPlugins = async () => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugins = await pluginRepository.find({
      relations: ["pages"],
    });
    return plugins;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const getPluginById = async (pluginId: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    return await pluginRepository.findOneBy({ id: pluginId });
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const updatePlugin = async (pluginId: string, updatedData: any) => {
  const pluginRepository = await getRepository(Plugins);
  const pageRepository = await getRepository(Pages);
  try {
    const plugin = await pluginRepository.findOneBy({ id: pluginId });
    if (!plugin) {
      throw new Error("Plugin does not exist.");
    }
    if (Array.isArray(updatedData.pageId)) {
      const pages = await pageRepository.findBy({ id: In(updatedData.pageId) });
      const missingIds = updatedData.pageId.filter(
        (id: any) => !pages.some((page: any) => page.id === id)
      );
      if (missingIds.length > 0) {
        throw new Error(
          `The following page IDs do not exist: ${missingIds.join(", ")}`
        );
      }
      const data = updatedData?.existingPages || [];
      const filterPageFromData = (page: any) => {
        if (!data.length) {
          return null;
        }
        const foundItem = data.find((item: any) => item.id === page?.id);
        return foundItem;
      };
      for (const page of pages) {
        page.plugin = plugin;
        const pageWithVisibility = filterPageFromData(page);
        if (pageWithVisibility && pageWithVisibility?.visibility) {
          page.visibility = pageWithVisibility?.visibility;
        }
      }
      await pageRepository.save(pages);
    }
    return plugin;
  } catch (error) {
    console.error("Error updating plugin:", (error as Error).message);
    throw new Error("Failed to update plugin.");
  }
};

const deletePlugin = async (pluginId: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    await pluginRepository.delete({ id: pluginId });
    return "Plugin deleted successfully.";
  } catch (error) {
    throw new Error("Failed to delete plugin.");
  }
};

const createTncPage = async (pluginId: string) => {
  const pageRepository = await getRepository(Pages);
  try {
    const pagePayload = pageRepository.create({
      title: tncPage.title,
      description: tncPage.description,
      visibility: [],
      isCustomPage: true,
      plugin: { id: pluginId } as any,
    });
    await pageRepository.save(pagePayload);
    return;
  } catch (error) {
    throw new Error("Failed to create page.");
  }
};

const createTncPlugin = async (portalId: string, createdBy: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugin = pluginRepository.create({
      type: PluginType.TNC,
      portalId: portalId,
      createdBy: createdBy,
    });
    await pluginRepository.save(plugin);
    await createTncPage((plugin as any).id);
    return plugin;
  } catch (error) {
    throw new Error("Failed to create plugin.");
  }
};

export default {
  createPlugin,
  getPluginByTypeAndPortal,
  getPluginByPortalId,
  getAllPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin,
  createTncPlugin,
};

