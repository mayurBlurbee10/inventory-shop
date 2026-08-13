import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import pageService from "../services/page.service.ts";
import { asyncHandler } from "../utils/helper.ts";
import { existingPages } from "../utils/data/existingPages.ts";

const getPage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { pageId, page, portalId } = req.query;
    console.log("pageId pageTitle portalId", pageId, page, portalId);

    let portalPage;
    if (page && portalId) {
      portalPage = await pageService.getPageByTitle(portalId as string, page as string);
    } else {
      portalPage = await pageService.getPageById(pageId as string);
    }
    console.log("page: ", portalPage);
    if (!portalPage) {
      return res.status(409).json({
        error: `Page doesn't exist`,
      });
    }

    return res.status(200).json({
      message: `Page fetched successfully.`,
      data: portalPage,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to get page.`,
      details: (error as Error).message,
    });
  }
});

const createPage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    console.log("data: ", data);

    if (!data.title || !data.description) {
      return res.status(400).json({
        error: "title and description are required field",
      });
    }

    const pageExist = await pageService.checkIfPageWithTitleExist(
      data.portalId,
      data.title
    );
    console.log("pageExist: ", pageExist);
    if (pageExist) {
      return res.status(409).json({
        error: `${data.title} page already exists.`,
      });
    }
    const page = await pageService.createPage(data);
    console.log("page post: ", page);

    return res.status(200).json({
      message: `page created successfully.`,
      data: page,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to create page ${req.body.title}.`,
      details: (error as Error).message,
    });
  }
});

const updatePage = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const data = req.body;
  console.log("data: ", data);

  if (!data.title || !data.description || !data.id) {
    return res.status(400).json({
      error: "title and description are required fields",
    });
  }

  try {
    const page = await pageService.getPageById(data.id);
    console.log("pageExist: ", page);

    if (!page) {
      return res.status(404).json({
        error: `Page with title "${data.title}" does not exist.`,
      });
    }

    // Proceed to update the page
    const updatedPage = await pageService.updatePage(data.id, {
      title: data.title,
      description: data.description,
    });
    console.log("Updated page: ", updatedPage);

    return res.status(200).json({
      message: `Page "${data.title}" updated successfully.`,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to update page with title "${data.title}".`,
      details: (error as Error).message,
    });
  }
});

const deletePage = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      error: "id is a required field",
    });
  }

  try {
    const page = await pageService.getPageById(id);
    console.log("pageExist: ", page);

    if (!page) {
      return res.status(404).json({
        error: `Page does not exist.`,
      });
    }

    // Proceed to delete the page
    await pageService.deletePage(id);
    console.log(`Page deleted successfully.`);

    return res.status(200).json({
      message: `Page deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to delete page with title "${id}".`,
      details: (error as Error).message,
    });
  }
});

// Bulk operations
const bulkPages = async (
  items: any[],
  errors: string[],
  results: any[],
  portalId: string,
  pluginId: string,
  updateVisibility: boolean = false
) => {
  for (const item of items) {
    try {
      const pageExist = await pageService.checkIfPageWithTitleExist(
        portalId,
        item.title
      );
      if (pageExist) {
        if (updateVisibility) {
          const result = await pageService.updatePage(pageExist.id, {
            visibility: item.sections,
          });
          results.push(result);
          continue;
        }
        results.push(pageExist);
        continue;
      }
      const obj = {
        title: item.title,
        description: item.description,
        isCustomPage: item.isCustomPage ?? false,
        visibility: item.sections,
        plugin: pluginId,
        ...(item.title === "reports" && { isPageVisible: false }),
      };
      const page = await pageService.createPage(obj);
      if (!page) {
        throw new Error(`Page can't created with ${item}`);
      }
      results.push(page);
    } catch (error: any) {
      errors.push(error.message);
    }
  }
};

const bulkCreatePages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { portalId, pluginId } = req.body;
    const items = existingPages;
    const results: any[] = [];
    const errors: string[] = [];

    await bulkPages(items, errors, results, portalId, pluginId, false);

    return res.status(200).json({
      message: "Pages Created",
      data: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error bulk creating pages:", error);
    return res.status(500).json({
      error: "Failed to create pages.",
      details: (error as Error).message,
    });
  }
});

const bulkDeletePages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Invalid request. 'pageIds' must be a non-empty array.",
      });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const page of items) {
      try {
        await pageService.deletePage(page.id);
        results.push({ page, status: "deleted" });
      } catch (error: any) {
        errors.push(`Failed to delete page with ID ${page.id}: ${error.message}`);
      }
    }

    return res.status(200).json({
      message: "Page deletion completed",
      deletedPages: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error bulk deleting pages:", error);
    return res.status(500).json({
      error: "Failed to delete pages.",
      details: (error as Error).message,
    });
  }
});

// Page Status
const updatePageStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { isPageVisible, id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Page ID is required" });
    }

    const page = await pageService.getPageById(id);

    if (!page) {
      return res.status(404).json({
        error: `Page does not exist.`,
      });
    }

    const updatedPage = await pageService.updatePage(id, {
      isPageVisible: isPageVisible,
    });

    return res.status(200).json({
      message: `Page status updated successfully.`,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: `Failed to update page.`,
      details: (error as Error).message,
    });
  }
});

export default {
  getPage,
  createPage,
  updatePage,
  deletePage,
  bulkCreatePages,
  bulkDeletePages,
  updatePageStatus,
};

