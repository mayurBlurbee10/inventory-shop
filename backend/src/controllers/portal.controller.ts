import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import userService from "../services/user.service.ts";
import { sanitizeName, reverseSanitizeName } from "../utils/commonUtils.ts";
import { asyncHandler } from "../utils/helper.ts";
import portalService from "../services/portal.service.ts";
import { UserRole } from "../config/constants.ts";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import { Readable } from "stream";
import permissionService from "../services/permission.service.ts";
import taskService from "../services/task.service.ts";
import messageService from "../services/message.service.ts";
import contentManagementService from "../services/contentManagement.service.ts";
import checkListService from "../services/checkList.service.ts";
import pluginService from "../services/plugin.service.ts";
import resetService from "../services/reset.service.ts";
import ndaAgreementService from "../services/ndaAgreement.service.ts";
import { addCollaborator } from "../services/box.service.ts";
import { getBoxClient } from "../utils/boxClient.ts";

const portalsDir = path.join(process.cwd(), "public", "portals");
const client = getBoxClient();

async function ensurePortalsDirectory() {
  try {
    await fs.access(portalsDir);
    console.log("Portals directory exists:", portalsDir);
  } catch {
    console.log("Creating portals directory:", portalsDir);
    await fs.mkdir(portalsDir, { recursive: true });
  }
}

const uploadSampleFiles = async (
  email?: string,
  userId?: string,
  parentFolderId?: string
) => {
  if (!parentFolderId) {
    return [];
  }

  const demoPath = path.join(process.cwd(), "public", "demo");
  const foldersInDemo = fsSync.readdirSync(demoPath).filter((folder) =>
    fsSync.statSync(path.join(demoPath, folder)).isDirectory()
  );

  const uploadedFolders: any[] = [];

  for (const folderName of foldersInDemo) {
    const localFolderPath = path.join(demoPath, folderName);

    const folderSearch = await client.search.searchForContent({
      query: `"${folderName}"`,
      type: "folder",
      fields: ["id", "name"],
      ancestorFolderIds: [parentFolderId],
    }) as any;

    console.log(`folder ${folderName}`, folderSearch);
    let folderId;
    if (!folderSearch.entries.length) {
      const createdFolder = await client.folders.createFolder({
        name: folderName,
        parent: { id: parentFolderId },
      });
      folderId = createdFolder.id;
      uploadedFolders.push({ name: folderName, id: folderId });
    } else {
      folderId = folderSearch.entries[0].id;
      uploadedFolders.push({ name: folderName, id: folderId });
    }

    const files = fsSync
      .readdirSync(localFolderPath)
      .filter((file) => fsSync.statSync(path.join(localFolderPath, file)).isFile());

    for (const fileName of files) {
      const filePath = path.join(localFolderPath, fileName);
      const buffer = fsSync.readFileSync(filePath);

      const fileSearch = await client.search.searchForContent({
        query: `"${fileName}"`,
        type: "file",
        fields: ["id", "name"],
        ancestorFolderIds: [folderId],
      }) as any;
      console.log(`file ${fileName}`, fileSearch);
      let fileId;
      if (!fileSearch.entries.length) {
        const fileStream = new Readable();
        fileStream.push(buffer);
        fileStream.push(null);

        const uploadedFileRes = await client.uploads.uploadFile({
          attributes: {
            name: fileName,
            parent: { id: folderId },
          },
          file: fileStream,
        }) as any;

        fileId = uploadedFileRes.entries[0].id;
      } else {
        fileId = fileSearch.entries[0].id;
      }

      const collaborations =
        await client.listCollaborations.getFileCollaborations(fileId);
      const isAlreadyCollaborator = collaborations?.entries?.some(
        (collab) => collab.accessibleBy && collab.accessibleBy.id === userId,
      );

      if (!isAlreadyCollaborator && userId) {
        await addCollaborator(fileId, userId, "editor", "file");
      }
    }
  }

  // Create folders manually if not already present
  const defaultFolders = ["Loan", "Statements"];
  for (const folderName of defaultFolders) {
    const folderSearch = await client.search.searchForContent({
      query: `"${folderName}"`,
      type: "folder",
      fields: ["id", "name"],
      ancestorFolderIds: [parentFolderId],
    }) as any;

    if (!folderSearch.entries.length) {
      const createdFolder = await client.folders.createFolder({
        name: folderName,
        parent: { id: parentFolderId },
      }) as any;
      uploadedFolders.push({ name: folderName, id: createdFolder.id });
    } else {
      uploadedFolders.push({ name: folderName, id: folderSearch.entries[0].id });
    }
  }

  return uploadedFolders;
};

const createPortal = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  await ensurePortalsDirectory();
  const data = req.body;
  console.log("data: ", data);
  let { legalName } = data;
  console.log("legalName: ", legalName);
  if (!legalName) {
    return res.status(400).json({ error: "Name are required" });
  }

  try {
    const portalExist = await portalService.getPortalByLegalName(legalName);
    console.log("portalExist: ", portalExist);
    if (portalExist) {
      return res.status(409).json({
        error: `${legalName} already exists.`,
      });
    }

    const portal = await portalService.createPortal(data);
    console.log("portal post: ", portal);
    if (!portal) {
      return res.status(404).json({
        error: `portal ${legalName} not found.`,
      });
    }

    const portalId = sanitizeName(legalName);
    await resetService.createSampleMessage(portalId);
    await resetService.createSampleTasks(portalId);
    await pluginService.createTncPlugin(portalId, (portal as any)?.portalCreatedAdmin);
    await ndaAgreementService.createDefaultAgreements(portalId);
    const user: any = await userService.getUserById((portal as any)?.portalCreatedAdmin);
    await uploadSampleFiles(user?.email, user?.boxUserId, user?.folderId);

    return res.status(200).json({
      message: `portal created successfully.`,
      data: portal,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create config file.",
      details: (error as Error).message,
    });
  }
});

const getPortals = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalid, userId, id } = req.query;

    if (portalid) {
      const portalLegalName = reverseSanitizeName(portalid as string);
      const portal = await portalService.getPortalByLegalName(portalLegalName);
      if (!portal) {
        return res.status(404).json({
          error: `portal ${portalid} not found.`,
        });
      }
      return res.status(200).json({
        message: `portal retrieved successfully.`,
        data: portal,
      });
    }

    if (userId) {
      let allPortals: any[] = [];
      let userCount = 0;

      const User = await userService.getUserById(userId as string);
      if (User?.groupMembersIds && User.groupMembersIds?.length > 0) {
        for (const id of User.groupMembersIds) {
          const groupportals = await portalService.getPortalsByUser(
            String(id).toLowerCase()
          );
          allPortals = [...allPortals, ...groupportals.portals];
          userCount = groupportals.activeUsers;
        }
      }

      const portals = await portalService.getPortalsByUser(
        String(userId).toLowerCase()
      );
      allPortals = [...allPortals, ...portals.portals];
      userCount = userCount + portals.activeUsers;

      return res.status(200).json({
        message: `portals retrieved successfully.`,
        data: { portals: allPortals, activeUsers: userCount },
      });
    }

    if (id) {
      const portal = await portalService.getPortalById(id as string);
      return res.status(200).json({
        message: `portal retrieved successfully.`,
        data: portal,
      });
    }

    const portals = await portalService.getPortals();
    return res.status(200).json({
      message: `portals retrieved successfully.`,
      data: portals,
    });
  } catch (error) {
    console.error("Error fetching portal files:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve portal files.",
      details: (error as Error).message,
    });
  }
});

const updatePortal = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const portalData = req.body;
    const portal = await portalService.updatePortalThemes(portalData);
    return res.status(200).json({
      message: `portal updated successfully.`,
      data: portal,
    });
  } catch (error) {
    console.error("Error update portal:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to update portal.",
      details: (error as Error).message,
    });
  }
});

const deletePortal = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Log the API call
    await logApiCall(req);

    // Parse request body
    const { id } = req.body;

    // Retrieve portal by ID
    const portal = await portalService.getPortalById(id);
    if (!portal) {
      return res.status(404).json({ error: "Portal not found." });
    }

    // Retrieve users associated with the portal
    const portalUsers = await userService.getUsersByPortal(
      sanitizeName(portal.legalName)
    );

    // Validate portal users and delete non-SUPER_ADMIN users
    const deletionPromises = portalUsers
      .filter((user: any) => user?.role !== UserRole.SUPER_ADMIN && user?.id)
      .map((user: any) => {
        if (!user.id) {
          console.warn(
            `Skipping user with invalid ID: ${JSON.stringify(user)}`
          );
          return Promise.resolve();
        }
        return Promise.all([
          permissionService.removePermission(user.id, sanitizeName(portal.legalName)),
          (taskService as any).deleteUserTasks(user.id, sanitizeName(portal.legalName)),
        ]).catch((error: Error) => {
          console.error(`Failed to clean up user with ID ${user.id}:`, error.message);
          throw new Error(`Failed to clean up user: ${user.id}`);
        });
      });

    await Promise.all(deletionPromises);

    const portalId = sanitizeName(portal.legalName);

    // Fetch users after deletion for validation/debugging
    const portalUsersAfterDelete = await userService.getUsersByPortal(portalId);

    await messageService.deleteAllMessage(portalId);
    await contentManagementService.deleteAllContent(portalId);
    await checkListService.deleteAllChecklists(portalId);
    const portalPlugins = await pluginService.getPluginByPortalId(portalId);
    await Promise.all(
      (portalPlugins || []).map((plugin: any) => pluginService.deletePlugin(plugin.id))
    );

    // Delete the portal
    await portalService.deletePortal((portal as any).id);

    // Return success response
    return res.status(200).json({
      message: "Portal deleted successfully.",
      data: portalUsers,
      dataAfterDelete: portalUsersAfterDelete,
    });
  } catch (error) {
    console.error("Error deleting portal:", error);
    return res.status(500).json({
      error: "Failed to delete portal.",
      details: (error as Error).message,
    });
  }
});

// Portal Duplicate
const duplicatePortal = asyncHandler(async (req: Request, res: Response) => {
  try {
    // await logApiCall(req);
    const data = req.body;

    let { legalName, domain, createdBy, existingPortal } = data;

    if (!legalName || !data.id || !domain || !createdBy) {
      return res.status(400).json({
        error: "Company Name and Domain Setup fields required",
      });
    }

    const portalExist = await portalService.getPortalById(data.id);

    if (!portalExist) {
      return res.status(409).json({
        error: `${legalName} already exists.`,
      });
    }

    const { id, createdAt, updatedAt, ...rest } = portalExist;
    const portalData = {
      ...rest,
      legalName: legalName,
      domain: domain,
      createdBy: createdBy,
      status: "setup",
    };

    const portal = await portalService.createPortal(portalData);

    if (!portal) {
      return res.status(404).json({
        error: `portal ${legalName} not found.`,
      });
    }

    const permissionService = (await import("../services/permission.service.ts")).default;
    let adminUser;
    if ((portal as any).portalCreatedAdmin) {
      adminUser = await permissionService.updatePermission(
        (portal as any).portalCreatedAdmin,
        { permissions: { portalId: sanitizeName(legalName), role: "admin" } }
      );
    }

    const pluginService = (await import("../services/plugin.service.ts")).default;
    const pageService = (await import("../services/page.service.ts")).default;
    const { PluginType } = await import("../config/constants.ts");

    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      PluginType.PAGES,
      sanitizeName(existingPortal)
    );

    const pages = (pluginExist as any)[0].pages.filter((page: any) => !page.isCustomPage);

    const filterPageVisibility = (pageTitle: string) => {
      const page = pages.find((p: any) => p.title === pageTitle);
      return page.isPageVisible;
    };

    const plugin = await pluginService.createPlugin({
      type: PluginType.PAGES,
      portalId: sanitizeName(legalName),
      createdBy: createdBy,
    });

    const { existingPages } = await import("../utils/data/existingPages.ts");
    const items = existingPages;
    let results: any[] = [];
    let errors: string[] = [];

    for (const item of items) {
      try {
        const pageExist = await pageService.checkIfPageWithTitleExist(
          sanitizeName(legalName),
          item.title
        );
        if (pageExist) {
          const pageUpdated = await pageService.updatePage(pageExist.id, {
            isPageVisible: filterPageVisibility(item.title),
          });
          results.push(pageUpdated);
          continue;
        }
        const obj = {
          title: item.title,
          description: item.description,
          isCustomPage: false,
          visibility: item.sections,
          plugin: plugin?.id,
          isPageVisible: filterPageVisibility(item.title),
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

    return res.status(200).json({
      message: `portal created successfully.`,
      data: portal,
      user: results,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create config file.",
      details: (error as Error).message,
    });
  }
});

const resetPortal = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { portalId } = req.body;

  if (!portalId) {
    return res.status(400).json({ error: "portalid is required" });
  }

  try {
    await resetService.resetPortal(portalId);

    return res.status(200).json({
      message: "Portal data reset successfully.",
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to reset portal.",
      details: (error as Error).message,
    });
  }
});

export default {
  createPortal,
  getPortals,
  updatePortal,
  deletePortal,
  duplicatePortal,
  resetPortal,
};

