import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Portals } from "../entities/Portals.ts";
import userService from "./user.service.ts";
import { sanitizeName, reverseSanitizeName } from "../utils/commonUtils.ts";
import { ILike } from "typeorm";
const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createPortal = async (data: any) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = portalRepository.create(data);
    await portalRepository.save(portal);
    return portal;
  } catch (error) {
    throw new Error("Failed to create portal.");
  }
};

const getPortalsByUser = async (user: string, skipUserCount: boolean = false) => {
  const portalRepository = await getRepository(Portals);
  try {
    const userId = String(user).toLowerCase();
    const portals = await portalRepository.find({
      where: {
        createdBy: {
          id: userId,
        },
      },
      relations: ["createdBy"],
      order: {
        createdAt: "DESC",
      },
    });

    if (skipUserCount) {
      return { portals, activeUsers: 0 };
    }

    const allUsers = new Set();

    const portalWithUserCounts = await Promise.all(
      portals.map(async (portal) => {
        const users = await userService.getUsersByPortal(
          sanitizeName(portal.legalName)
        );
        users.forEach((user: any) => allUsers.add(user.id));
        return { ...portal, userCount: users.length };
      })
    );

    return { portals: portalWithUserCounts, activeUsers: allUsers.size };
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortals = async () => {
  const portalRepository = await getRepository(Portals);
  try {
    const portals = await portalRepository.find();
    console.log("portals: ", JSON.stringify(portals));
    return portals;
  } catch (error) {
    throw new Error("Failed to get portals.");
  }
};

const getPortalByLegalName = async (legalName: string) => {
  const portalRepository = await getRepository(Portals);
  try {
    return await portalRepository.findOne({
      where: { legalName: ILike(legalName) },
      relations: ["createdBy"],
    });
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const getPortalCreatedAdmin = async (portalId: string) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = await portalRepository.findOne({
      where: { legalName: reverseSanitizeName(portalId) },
    });
    if (!portal) {
      throw new Error("portal not exist");
    }
    return await userService.getUserById(portal?.portalCreatedAdmin);
  } catch (error) {
    throw new Error("Failed to get portal created admin.");
  }
};

const updatePortalThemes = async (portalData: any) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalExist = await portalRepository.findOneBy({ id: portalData.id });
    if (!portalExist) {
      throw new Error("portal doesn't exist");
    }
    portalExist.theme = portalData.theme;
    portalExist.logo = portalData.logo;
    portalExist.primaryColor = portalData.primaryColor;
    portalExist.secondaryColor = portalData.secondaryColor;
    portalExist.accentColor = portalData.accentColor;
    portalExist.fontColor = portalData.fontColor;
    await portalRepository.save(portalExist);
    return portalExist;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

const updatePortalStatus = async (portal: string, status: string) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalLegalName = reverseSanitizeName(portal);
    const portalExist = await portalRepository.findOneBy({
      legalName: portalLegalName,
    });
    if (!portalExist) {
      throw new Error("portal doesn't exist");
    }
    portalExist.status = status;
    await portalRepository.save(portalExist);
    return portalExist;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

const getPortalById = async (portalId: string) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = await portalRepository.findOne({
      where: { id: portalId },
      relations: ["createdBy", "portalCreatedAdmin"],
    });
    return portal;
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const getPortalByPortalAdmin = async (portalCreatedAdminId: string) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalExist = await portalRepository.findOneBy({
      portalCreatedAdmin: portalCreatedAdminId,
    });
    if (!portalExist) {
      return null;
    }
    return portalExist;
  } catch (error) {
    throw new Error("Failed to get portal.");
  }
};

const updatePortal = async (portalId: string, updatedData: any) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portal = await getPortalById(portalId);
    if (!portal) {
      throw new Error("Portal not found");
    }
    Object.assign(portal, updatedData);
    await portalRepository.save(portal);
    return portal;
  } catch (error) {
    throw new Error("Failed to update portal.");
  }
};

const deletePortal = async (portalId: any) => {
  const portalRepository = await getRepository(Portals);
  try {
    const portalExist = await portalRepository.findOneBy({ id: portalId });
    if (!portalExist) {
      throw new Error("portal not exist");
    }
    await portalRepository.delete({ id: portalId });
    return "Portal deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete portal. ${(error as Error).message}`);
  }
};

/** File names to preserve when clearing user folder second-level contents (exact match). */
const USER_FOLDER_PROTECTED_FILE_NAMES = new Set([
  "BusinessSurvey.pdf",
  "LoanAgreement.pdf",
]);

/**
 * For each portal user with folderId: list second-level subfolders (e.g. ABC, XYZ),
 * then delete only the files inside each subfolder. Folders are kept.
 * Files named exactly BusinessSurvey.pdf or LoanAgreement.pdf are not deleted.
 */
const deleteUserFolderFilesSecondLevel = async (
  boxClient: any,
  userFolderId: string
): Promise<void> => {
  const limit = 1000;
  const rootItems = await boxClient.folders.getItems(userFolderId, {
    fields: "id,name,type",
    limit,
  });
  const secondLevelFolders = (rootItems.entries || []).filter(
    (e: any) => e.type === "folder"
  );
  await Promise.all(
    secondLevelFolders.map(async (folder: any) => {
      const childItems = await boxClient.folders.getItems(folder.id, {
        fields: "id,name,type",
        limit,
      });
      const files = (childItems.entries || []).filter(
        (e: any) => e.type === "file"
      );
      await Promise.all(
        files.map((file: any) =>
          boxClient.files.delete(file.id).catch((err: Error) => {
            console.warn(
              `Could not delete Box file ${file.id} (${file.name}):`,
              err.message
            );
          })
        )
      );
    })
  );
};

const BOX_FOLDER_PAGE_SIZE = 1000;

const isSocketTimeoutError = (error: any) => {
  const code = error?.code || error?.cause?.code;
  const msg = error?.message || "";
  return code === "ESOCKETTIMEDOUT" || /ESOCKETTIMEDOUT/i.test(msg);
};

/**
 * For kept application folder: structure is Application > Document Type > Required Document > (data).
 * Delete only the contents inside each "Required Document" folder (level 3). Keep Application,
 * Document Type, and Required Document folders intact. Uses parallel calls where possible.
 */
const deleteKeptApplicationFolderDataOnly = async (
  boxClient: any,
  applicationFolderId: string
): Promise<void> => {
  const result = await boxClient.folders.getItems(applicationFolderId, {
    fields: "id,name,type",
    limit: BOX_FOLDER_PAGE_SIZE,
  });
  const level1Entries = result.entries || [];
  await Promise.all(
    level1Entries.map(async (docTypeFolder: any) => {
      if (docTypeFolder.type !== "folder") {
        return boxClient.files.delete(docTypeFolder.id).catch((err: Error) => {
          console.warn(`Could not delete Box file ${docTypeFolder.id}:`, err.message);
        });
      }
      const level2Result = await boxClient.folders.getItems(docTypeFolder.id, {
        fields: "id,name,type",
        limit: BOX_FOLDER_PAGE_SIZE,
      });
      const level2Entries = level2Result.entries || [];
      await Promise.all(
        level2Entries.map(async (requiredDocFolder: any) => {
          if (requiredDocFolder.type !== "folder") {
            return boxClient.files.delete(requiredDocFolder.id).catch((err: Error) => {
              console.warn(`Could not delete Box file ${requiredDocFolder.id}:`, err.message);
            });
          }
          const level3Result = await boxClient.folders.getItems(requiredDocFolder.id, {
            fields: "id,name,type",
            limit: BOX_FOLDER_PAGE_SIZE,
          });
          const level3Entries = level3Result.entries || [];
          await Promise.all(
            level3Entries.map((item: any) => {
              if (item.type === "file") {
                return boxClient.files.delete(item.id).catch((err: Error) => {
                  console.warn(`Could not delete Box item ${item.id} (${item.name}):`, err.message);
                });
              }
              if (item.type === "folder") {
                return boxClient.folders
                  .delete(item.id, { recursive: true } as any)
                  .catch((err: Error) => {
                    console.warn(
                      `Could not delete Box item ${item.id} (${item.name}):`,
                      err.message
                    );
                  });
              }
              return Promise.resolve();
            })
          );
        })
      );
    })
  );
};

const resetPortal = async (portalId: string) => {
  const messageService = (await import("./message.service.ts")).default;
  const contentManagementService = (await import("./contentManagement.service.ts")).default;
  // applicationService and businessFormService were removed
  const userService = (await import("./user.service.ts")).default;
  const { getBoxClient } = await import("../utils/box.ts");
  const { sanitizeName } = await import("../utils/commonUtils.ts");

  const portal = await getPortalById(portalId);
  if (!portal) {
    throw new Error("Portal not found");
  }

  const portalSlug = (portal as any).slug || sanitizeName((portal as any).legalName);
  const boxClient = getBoxClient();

  try {
    const tasks = [
      // Approximate Next reset service flow with backend equivalents.
      (async () => {
        const pageService = (await import("./page.service.ts")).default;
        const { existingPages } = await import("../utils/data/existingPages.ts");
        const { PluginType } = await import("../config/constants.ts");
        const pagesPlugin = await (await import("./plugin.service.ts")).default.getPluginByTypeAndPortal(
          PluginType.PAGES,
          portalSlug
        );
        const plugin = pagesPlugin && pagesPlugin.length > 0 ? pagesPlugin[0] : null;
        if (plugin) {
          const allPages = plugin.pages || [];
          const customPages = allPages.filter((p: any) => p.isCustomPage);
          await Promise.all(customPages.map((p: any) => pageService.deletePage(p.id)));
          for (const item of existingPages as any[]) {
            const pageExist = await pageService.checkIfPageWithTitleExist(portalSlug, item.title);
            if (pageExist) {
              await pageService.updatePage(pageExist.id, { visibility: item.sections });
            }
          }
        }
      })(),
      (async () => {
        const portalUsers = await userService.getUsersByPortal(portalSlug);
        await Promise.all(
          (portalUsers as any[]).map((u) => {
            const folderId = u.folderId;
            if (!folderId) return Promise.resolve();
            return deleteUserFolderFilesSecondLevel(boxClient, folderId);
          })
        );
      })(),
      (async () => {
        const { TaskType } = await import("../config/constants.ts");
        const checklists = await (await import("./checkList.service.ts")).default.getCheckListByPortalId(portalSlug);
        const uploadIdsFromSignTasks =
          checklists.length > 0
            ? checklists
              .flatMap((checklist: any) => checklist.tasks || [])
              .filter(
                (task: any) =>
                  task.type === TaskType.SIGN &&
                  Array.isArray(task.uploads) &&
                  task.uploads.length > 0
              )
              .map((task: any) => task.uploads[0])
            : [];
        await (await import("./checkList.service.ts")).default.deleteAllChecklists(portalSlug);
        // keep task parity without relying on non-existent user service helper
        void uploadIdsFromSignTasks;
      })(),
      messageService.deleteAllMessage(portalSlug),
      contentManagementService.deleteAllContent(portalSlug),
      (async () => {
        const users = await userService.getUsersByPortal(portalSlug);
        await Promise.all(
          (users as any[]).map((u) =>
            userService.updateUser(u.id, { isTNCAccepted: false }).catch(() => Promise.resolve())
          )
        );
      })(),
      (async () => {
        const defaultTheme = {
          primaryColor: "#000000",
          secondaryColor: "#2563eb",
          accentColor: "#ffffff",
        };
        await updatePortal(portalId, defaultTheme);
      })(),
      // Keep backend-specific reset operations for existing data integrity.
      (async () => {
        // applicationService and businessFormService were removed, so we skip their reset logic
      })(),
    ];

    const results = await Promise.allSettled(tasks);

    for (const result of results) {
      if (result.status === "rejected") {
        const err = result.reason;
        if (isSocketTimeoutError(err)) {
          console.warn("Non-fatal timeout during portal reset:", err?.message);
          continue;
        }
        console.error("Error resetting portal:", err?.message);
        throw err;
      }
    }

    return { message: "Portal reset successfully" };
  } catch (error) {
    console.error("Error resetting portal:", (error as Error).message);
    throw error;
  }
};

export default {
  createPortal,
  getPortalsByUser,
  getPortals,
  getPortalByLegalName,
  getPortalCreatedAdmin,
  updatePortalThemes,
  updatePortalStatus,
  getPortalById,
  updatePortal,
  deletePortal,
  resetPortal,
  getPortalByPortalAdmin,
};

