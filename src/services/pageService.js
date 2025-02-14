import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Pages } from "@/entities/Pages";
import { Plugins } from "@/entities/Plugins";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPage = async (data) => {
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

const updatePage = async (pageId, updatedData) => {
  const pageRepository = await getRepository(Pages);
  try {
    const page = await pageRepository.findOneBy({ id: pageId });

    if (!page) {
      throw new Error("page not exist");
    }

    page.title = updatedData.title;
    page.description = updatedData.description;
    await pageRepository.save(page);
    return page;
  } catch (error) {
    throw new Error("Failed to update page.");
  }
};

const checkIfPageWithTitleExist = async (portalId, pageTitle) => {
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
    const pageExists = plugins.some((plugin) =>
      plugin.pages.some((page) => page.title === pageTitle)
    );
    if (pageExists) {
      throw new Error(`Page with title "${pageTitle}" already exists.`);
    }
    return;
  } catch (error) {
    console.error("Error fetching page by title:", error.message);
    throw new Error(`Failed to get page "${pageTitle}".`);
  }
};


const getPageById = async (pageId) => {
  const pageRepository = await getRepository(Pages);
  try {
    const page = await pageRepository.find({ id: pageId });
    if (!page) {
      throw new Error(`Page doesn't exist with ${pageId}`);
    }
    return page;
  } catch (error) {
    throw new Error(`Failed to get page ${pageId}`);
  }
};

const getPageByTitle = async (portalId, pageTitle) => {
  const pageRepository = await getRepository(Pages);
  const pluginRepository = await getRepository(Plugins);

  try {
    const plugins = await pluginRepository.find({
      where: {
        portalId: portalId,
      },
      relations: ["pages"], // Include related pages in the query
    });

    if (!plugins || plugins.length === 0) {
      return null; // No plugins found
    }

    // Find the first page with the matching title
    for (const plugin of plugins) {
      const page = plugin.pages.find((page) => page.title === pageTitle);
      if (page) {
        return page; // Return the found page
      }
    }

    // If no page with the title was found
    return null;
  } catch (error) {
    console.error("Error fetching page by title:", error.message);
    throw new Error(`Failed to get page "${pageTitle}".`);
  }
};

const deletePage = async (pageId) => {
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
  getPageByTitle
};
