import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Pages } from "../entities/Pages.ts";
import { Plugins } from "../entities/Plugins.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPage = async (data: any) => {
  const pageRepository = await getRepository(Pages);
  try {
    const page = pageRepository.create(data);
    console.log("page", page);
    await pageRepository.save(page);
    return page;
  } catch (error) {
    throw new Error("Failed to create page.");
  }
};

const updatePage = async (pageId: string, updatedData: any) => {
  const pageRepository = await getRepository(Pages);
  try {
    const page = await pageRepository.findOneBy({ id: pageId });
    if (!page) {
      throw new Error("page not exist");
    }
    Object.assign(page, updatedData);
    await pageRepository.save(page);
    return page;
  } catch (error) {
    throw new Error("Failed to update page.");
  }
};

const checkIfPageWithTitleExist = async (portalId: string, pageTitle: string) => {
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugins = await pluginRepository.find({
      where: { portalId: portalId },
      relations: ["pages"],
    });
    if (!plugins || plugins.length === 0) {
      return null;
    }
    for (const plugin of plugins) {
      const page = plugin.pages?.find((page: any) => page.title === pageTitle);
      if (page) {
        return page;
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get page "${pageTitle}": ${(error as Error).message}`);
  }
};

const getPageById = async (pageId: string) => {
  const pageRepository = await getRepository(Pages);
  try {
    const pages = await pageRepository.find({ where: { id: pageId } });
    if (!pages || pages.length === 0) {
      throw new Error(`Page doesn't exist with ${pageId}`);
    }
    return pages[0];
  } catch (error) {
    throw new Error(`Failed to get page ${pageId}`);
  }
};

const getPageByTitle = async (portalId: string, pageTitle: string) => {
  const pageRepository = await getRepository(Pages);
  const pluginRepository = await getRepository(Plugins);
  try {
    const plugins = await pluginRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["pages"],
    });
    if (!plugins || plugins.length === 0) {
      return null;
    }
    for (const plugin of plugins) {
      const page = plugin.pages?.find((page: any) => page.title === pageTitle);
      if (page) {
        return page;
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get page "${pageTitle}".`);
  }
};

const deletePage = async (pageId: string) => {
  const pageRepository = await getRepository(Pages);
  try {
    const page = await pageRepository.findOneBy({ id: pageId });
    if (!page) {
      throw new Error("Page not found.");
    }
    await pageRepository.remove(page);
    return;
  } catch (error) {
    throw new Error("Failed to delete page.");
  }
};

export default {
  createPage,
  updatePage,
  checkIfPageWithTitleExist,
  getPageById,
  deletePage,
  getPageByTitle,
};

