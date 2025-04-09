import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Plugins } from "@/entities/Plugins";
import pageService from "./pageService";
import { Pages } from "@/entities/Pages";
import { In } from "typeorm";
import { PluginType } from "@/config/constants";
import { tncPage } from "@/app/lib/data/existingPages";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPlugin = async (data) => {
  const pluginRepository = await getRepository(Plugins);
  const pageRepository = await getRepository(Pages);
  try {
    const plugin = pluginRepository.create({
      type: data.type,
      portalId: data.portalId,
      createdBy: data.createdBy,
    });
    await pluginRepository.save(plugin);

    if (Array.isArray(data.pageId)) {
      // Fetch all Pages by their IDs
      const pages = await pageRepository.findBy({ id: In(data.pageId) });

      // Check for missing IDs
      const missingIds = data.pageId.filter(
        (id) => !pages.some((page) => page.id === id)
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

const updatePlugin = async (pluginId, updatedData) => {
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
        (id) => !pages.some((page) => page.id === id)
      );
      if (missingIds.length > 0) {
        throw new Error(
          `The following page IDs do not exist: ${missingIds.join(", ")}`
        );
      }

      const data = updatedData?.existingPages || []

      const filterPageFromData = (page)=>{
        if(!data.length){
          return null;
        }
        const foundItem = data.find((item)=>item.id === page?.id)
        return foundItem 
      }

      for (const page of pages) {
        page.plugin = plugin;
        const pageWithVisibility = filterPageFromData(page);
        if(pageWithVisibility && pageWithVisibility?.visibility){
          page.visibility = pageWithVisibility?.visibility 
        }
      }
      await pageRepository.save(pages);
    }
    return plugin;
  } catch (error) {
    console.error("Error updating plugin:", error.message);
    throw new Error("Failed to update plugin.");
  }
};

const getPluginByTypeAndPortal = async (pluginType, portalId) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugin = pluginRepository.find({
      where: {
        type: pluginType,
        portalId: portalId,
      },
      relations: ["pages"],
    });
    return plugin;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const getPluginByPortalId = async (portalId) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugin = pluginRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["pages"],
    });

    return plugin;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const getAllPlugins = async () => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugin = pluginRepository.find({
      relations: ["pages"],
    });
    return plugin;
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};
const getPluginById = async (pluginId) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    return await pluginRepository.findOneBy({ id: pluginId });
  } catch (error) {
    throw new Error("Failed to get plugin.");
  }
};

const deletePlugin = async (pluginId) => {
  const pluginRepository = await getRepository(Plugins);
  const pageRepository = await getRepository(Pages);
  try {
    const plugin = await pluginRepository.findOneBy({ id: pluginId });

    if (!plugin) {
      throw new Error("plugin not found.");
    }

    await pageRepository.delete({ plugin: { id: pluginId } });

    await pluginRepository.remove(plugin);
    return;
  } catch (error) {
    throw new Error("Failed to delete plugin.");
  }
};

const createTncPlugin = async(portalId, createdBy) => {
  const pluginRepository = await getRepository(Plugins);
  const pageRepository = await getRepository(Pages);
  try {
    const plugin = pluginRepository.create({
      type: PluginType.TNC,
      portalId: portalId,
      createdBy: createdBy,
    });
    await pluginRepository.save(plugin);

    const page = pageRepository.create({
      title: tncPage.title,
      description: tncPage.description,
      visibility: [],
      isCustomPage: false,
    });
    await pageRepository.save(page);
    return;
  } catch (error) {
    throw new Error("Failed to delete plugin.");
  }
}

export default {
  createPlugin,
  updatePlugin,
  getPluginByTypeAndPortal,
  getPluginByPortalId,
  getAllPlugins,
  deletePlugin,
  getPluginById,
  createTncPlugin
};
