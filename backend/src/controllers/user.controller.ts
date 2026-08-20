import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import {
  generateRefreshToken,
  generateNanoToken,
  generateToken,
} from "../utils/jwt.ts";
import { sendSetPasswordEmail } from "../utils/email.ts";
import userService from "../services/user.service.ts";
import notificationService from "../services/notification.service.ts";
import {
  UserRole,
  ApplicationStatus,
  OnboardingTasksType,
  NotificationConfigure,
} from "../config/constants.ts";
import permissionService from "../services/permission.service.ts";
import portalService from "../services/portal.service.ts";
import * as bcrypt from "bcrypt";
import { asyncHandler } from "../utils/helper.ts";
import { checklistFolders, FolderItem } from "../utils/data/folderStructure.ts";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { steps, tasks } from "../utils/data/onboarding.ts";
import taskService from "../services/task.service.ts";
import * as boxService from "../services/box.service.ts";
import Bottleneck from "bottleneck";
import { getBoxClient } from "../utils/boxClient.ts";
import { ensureBoxAppUser } from "../utils/boxCreateAppUser.ts";

function getBoxEntries(result: any): any[] {
  return result?.entries || result?.rawData?.entries || [];
}

async function listBoxFolders(parentFolderId: string) {
  const client = getBoxClient();
  const items = await client.folders.getFolderItems(parentFolderId, {
    queryParams: {
      fields: ["id", "name", "type", "parent"],
      limit: 1000,
    },
  });
  return getBoxEntries(items).filter((item: any) => item.type === "folder");
}

async function findBoxFolder(parentFolderId: string, name: string) {
  const folders = await listBoxFolders(parentFolderId);
  const expectedName = name.trim().toLowerCase();
  const match = folders.find(
    (item: any) => item.name?.trim().toLowerCase() === expectedName
  );
  if (!match) {
    return null;
  }

  const listedParentId = match.parent?.id;
  if (listedParentId && String(listedParentId) !== String(parentFolderId)) {
    console.log(
      `Ignoring "${name}" (${match.id}): parent ${listedParentId} is not ${parentFolderId}`
    );
    return null;
  }

  if (!listedParentId) {
    const client = getBoxClient();
    const details: any = await client.folders.getFolderById(String(match.id), {
      queryParams: { fields: ["id", "name", "parent"] },
    });
    if (String(details?.parent?.id) !== String(parentFolderId)) {
      console.log(
        `Ignoring "${name}" (${match.id}): verified parent ${details?.parent?.id} is not ${parentFolderId}`
      );
      return null;
    }
  }

  return match;
}

async function createBoxFolder(parentFolderId: string, name: string) {
  const client = getBoxClient();
  try {
    return await client.folders.createFolder({
      name,
      parent: { id: String(parentFolderId) },
    });
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.statusCode;
    if (status === 409 || error?.message?.includes("item_name_in_use")) {
      const conflict = error?.response?.body?.context_info?.conflicts?.[0];
      if (conflict?.id) {
        const details: any = await client.folders.getFolderById(
          String(conflict.id),
          { queryParams: { fields: ["id", "name", "parent"] } }
        );
        if (String(details?.parent?.id) === String(parentFolderId)) {
          return details;
        }
      }
      const existing = await findBoxFolder(parentFolderId, name);
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

async function findOrCreateBoxFolder(parentFolderId: string, name: string) {
  const existing = await findBoxFolder(parentFolderId, name);
  if (existing) {
    console.log(
      `Using existing Box folder "${name}" (${existing.id}) under parent ${parentFolderId}`
    );
    return existing;
  }
  console.log(
    `Box folder "${name}" not found under parent ${parentFolderId}. Creating it.`
  );
  return await createBoxFolder(parentFolderId, name);
}

async function findExistingDevPortalsFolder() {
  const configuredId = process.env.DEV_PORTALS_FOLDER_ID?.trim();
  if (!configuredId) {
    throw new Error(
      "DEV_PORTALS_FOLDER_ID is required. Set it to the Box folder ID of the dev-portals folder you use in the Box UI."
    );
  }

  const client = getBoxClient();
  const folder: any = await client.folders.getFolderById(configuredId, {
    queryParams: { fields: ["id", "name", "parent"] },
  });
  console.log("Using DEV_PORTALS_FOLDER_ID from env:", folder.id, folder.name);
  return folder;
}

async function setupPortalFoldersForBulk(portalId: string) {
  const devPortals = await findExistingDevPortalsFolder();
  if (!devPortals?.id) {
    throw new Error("dev-portals folder was not found");
  }

  const universalPortal = await findOrCreateBoxFolder(
    devPortals.id,
    "Universal Portal"
  );
  const client = getBoxClient();
  const universalPortalDetails: any = await client.folders.getFolderById(
    String(universalPortal.id),
    { queryParams: { fields: ["id", "name", "parent"] } }
  );
  console.log("Universal Portal parent check:", {
    id: universalPortalDetails?.id,
    name: universalPortalDetails?.name,
    parentId: universalPortalDetails?.parent?.id,
    expectedParentId: devPortals.id,
  });
  if (String(universalPortalDetails?.parent?.id) !== String(devPortals.id)) {
    throw new Error(
      `Universal Portal (${universalPortal.id}) is not inside dev-portals (${devPortals.id})`
    );
  }
  const portalFolder = await findOrCreateBoxFolder(universalPortal.id, portalId);
  const portalContentFolder = await findOrCreateBoxFolder(
    portalFolder.id,
    "Portal Content"
  );
  const userUploadsFolder = await findOrCreateBoxFolder(
    portalFolder.id,
    "User Uploads"
  );

  console.log("Bulk portal folder structure:", {
    devPortalsId: devPortals.id,
    universalPortalId: universalPortal.id,
    portalFolderId: portalFolder.id,
    portalContentFolderId: portalContentFolder.id,
    userUploadsFolderId: userUploadsFolder.id,
  });

  return {
    userUploadFolderId: userUploadsFolder.id,
    portalContentFolderId: portalContentFolder.id,
  };
}

async function addFolderEditor(folderId: string, userId: string) {
  if (!folderId || !userId) {
    return;
  }
  try {
    await boxService.addCollaborator(folderId, userId, "editor", "folder");
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.statusCode;
    if (status !== 409) {
      throw error;
    }
  }
}

async function ensureBoxUserAndFolder(userName: any, isPortalCreatedAdmin: boolean, folderIds: any) {
  const appUser = await ensureBoxAppUser(userName, Date.now().toString());

  if (isPortalCreatedAdmin) {
    await addFolderEditor(folderIds.portalContentFolderId, appUser.userId);
    return { boxUserId: appUser.userId, folderId: folderIds.portalContentFolderId };
  }

  const userFolder = await findOrCreateBoxFolder(folderIds.userUploadFolderId, userName);
  await addFolderEditor(userFolder.id, appUser.userId);
  return { boxUserId: appUser.userId, folderId: userFolder.id };
}

const limiter = new Bottleneck({
  minTime: 80, // 1000ms / 8 = 125ms
});

limiter.on("failed", async (error, jobInfo) => {
  if (error.statusCode === 429 && jobInfo.retryCount < 5) {
    const retryAfter = Number(error?.headers?.["retry-after"] || 1) * 1000;
    return retryAfter;
  }
});

const getUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const portalid = req.query.portalid as string;
    const email = req.query.email as string;
    const role = req.query.role as string;
    const userId = req.query.userId as string;
    const boxUserId = req.query.boxUserId as string;
    const check = req.query.check as string;

    let users: any = {};
    if (portalid) {
      users = await userService.getUsersByPortal(portalid);
    } else if (email && check) {
      users = await userService.getPortalCreateAdminByEmail(email);
    } else if (email) {
      users = await userService.getUserByEmail(email);
    } else if (role) {
      users = await userService.getUserByRole(role, userId);
    } else if (boxUserId) {
      users = await userService.getUserByBoxUserId(boxUserId);
    } else if (userId) {
      users = await userService.getUserById(userId);
    } else {
      users = await userService.getUsers();
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return res.status(500).json({
      error: "Failed to get users",
      details: (error as Error).message,
    });
  }
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const cookies = cookieHeader
      .split(";")
      .reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {});

    const userEmail = cookies.userEmail;

    if (!userEmail) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await userService.getUserByEmail(
      decodeURIComponent(userEmail),
      null,
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...safeUserData } = user;

    return res.status(200).json({
      user: safeUserData,
    });
  } catch (error) {
    console.error("Error in current user route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Sanitizes folder name by replacing invalid characters for Box
 * Box doesn't allow: / \ : * ? " < > |
 */
const sanitizeFolderName = (name: string): string => {
  return name
    .replace(/\//g, " or ") // Replace forward slash with " or "
    .replace(/\\/g, "") // Remove backslash
    .replace(/:/g, "-") // Replace colon with dash
    .replace(/\*/g, "") // Remove asterisk
    .replace(/\?/g, "") // Remove question mark
    .replace(/"/g, "'") // Replace double quotes with single quotes
    .replace(/</g, "") // Remove less than
    .replace(/>/g, "") // Remove greater than
    .replace(/\|/g, "-") // Replace pipe with dash
    .trim(); // Remove leading/trailing whitespace
};

export const createChecklistFolders = async (
  parentFolderId: string,
  folderItems: FolderItem[],
): Promise<void> => {
  try {
    const client = getBoxClient();

    for (const folderItem of folderItems) {
      try {
        // Sanitize folder name before creating
        const sanitizedFolderName = sanitizeFolderName(folderItem.title);

        // Create the parent folder
        const parentFolder = await client.folders.createFolder({
          name: sanitizedFolderName,
          parent: { id: parentFolderId },
        });


        console.log(
          `Created folder: ${sanitizedFolderName} with ID: ${parentFolder.id}`,
        );

        // Create child folders if they exist
        if (folderItem.children && folderItem.children.length > 0) {
          for (const child of folderItem.children) {
            try {
              // Sanitize child folder name before creating
              const sanitizedChildName = sanitizeFolderName(child.title);

              const childFolder = await client.folders.createFolder({
                name: sanitizedChildName,
                parent: { id: parentFolder.id },
              });

              console.log(
                `Created subfolder: ${sanitizedChildName} with ID: ${childFolder.id}`,
              );
            } catch (childError) {
              console.error(
                `Error creating subfolder ${child.title}:`,
                (childError as any).response?.body?.message ||
                (childError as Error).message,
              );
              // Continue with next child folder even if one fails
            }
          }
        }
      } catch (folderError) {
        console.error(
          `Error creating folder ${folderItem.title}:`,
          (folderError as any).response?.body?.message ||
          (folderError as Error).message,
        );
        // Continue with next folder even if one fails
      }
    }
  } catch (error) {
    console.error("Error in createChecklistFolders:", error);
    throw error;
  }
};

const uploadPdfToFolder = async (
  folderId: string,
  fileName: string,
  label: string,
) => {
  const pdfPath = path.join(process.cwd(), "public", fileName);

  if (!fs.existsSync(pdfPath)) {
    console.warn(`${fileName} not found at ${pdfPath}, skipping upload`);
    return;
  }

  const client = getBoxClient();

  const pdfBuffer = fs.readFileSync(pdfPath);

  const fileStream = new Readable();
  fileStream.push(pdfBuffer);
  fileStream.push(null);

  const uploadedFileRes = await client.uploads.uploadFile({
    attributes: {
      name: `${label}.pdf`,
      parent: { id: folderId },
    },
    file: fileStream,
  });

  const uploadedFile = uploadedFileRes.entries?.[0];
  console.log(`Uploaded ${fileName} with ID: ${uploadedFile?.id}`);
};

export const createFolderStructure = async (
  userId: string,
  userFolderId: string,
  portalId: string,
) => {
  try {
    // const portal = await portalService.getPortalByLegalName(
    //   reverseSanitizeName(portalName),
    // );

    const client = getBoxClient();

    let applicationFolderId = null;

    await Promise.all(
      (steps ?? []).map(async (step) => {
        // ✅ Create Step Folder
        const stepFolder = (await limiter.schedule(() => client.folders.createFolder({
          name: step.label,
          parent: { id: userFolderId },
        }))) as any;

        // onboardingStepService and onboardingTaskService were removed
        const onboardStep: any = null;

        // ✅ Create Tasks Under Step
        await Promise.all(
          (tasks ?? []).map(async (task) => {
            const taskFolder = (await limiter.schedule(() => client.folders.createFolder({
              name: task.label,
              parent: { id: stepFolder.id },
            }))) as any;

            // 🔥 DOCUMENT_UPLOAD
            if (task.type === OnboardingTasksType.DOCUMENT_UPLOAD) {
              applicationFolderId = taskFolder.id as string;
              await createChecklistFolders(taskFolder.id, checklistFolders);
            }

            if (
              task.type === OnboardingTasksType.SIGN ||
              task.type === OnboardingTasksType.EDIT_SIGN
            ) {
              await uploadPdfToFolder(
                taskFolder.id as string,
                "BusinessSurvey.pdf",
                task.label,
              );
            }

            // 🔥 NDA_SIGN
            if (task.type === OnboardingTasksType.NDA_SIGN) {
              await uploadPdfToFolder(
                taskFolder.id as string,
                "LoanAgreement.pdf",
                task.label,
              );
            }

            return Promise.resolve();
          }),
        );
      }),
    );
    return applicationFolderId;
  } catch (error) {
    console.error("Error creating folder structure:", error);
    throw error;
  }
};

const createUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { from = null, ...userData } = req.body;
    console.log("Received user data:", userData);

    const userExist = await userService.getUserByEmail(userData.email);
    const mainUser = await userService.getUserById(userData.createdBy);

    if (!mainUser) {
      return res.status(404).json({
        error: "Creator user not found.",
      });
    }

    const creatorPortalPermission = await userService.getUserPortalPermission(
      userData?.portal ?? null,
      mainUser.id,
    );
    const mainUserRole = creatorPortalPermission?.role ?? null;

    if (userExist) {
      console.log("userExist", userExist);
      const token = await generateNanoToken();
      let newUser: any = {
        email: userData.email,
        firstName: userData.firstName || userData.email.split("@")[0],
        lastName: userData.lastName || "",
        role: userData.role,
        phoneNo: userData.phoneNo,
        ndaPages: userData.ndaPages || null,
        // permissions: userData.permissions, //updated Field
      };

      if (
        userData.role !== UserRole.SUPER_ADMIN &&
        userData.role !== UserRole.MASTER
      ) {
        newUser.resetPasswordToken = token;
        newUser.isOnboardingRequired = userData.isOnboardingRequired;
        // newUser.portalId = userData.portal;
      } else if (userData.role === UserRole.SUPER_ADMIN) {
        newUser.isOnboardingRequired = userData.isOnboardingRequired;
        if (mainUserRole === UserRole.SUPER_ADMIN) {
          if (!mainUser?.groupMembersIds) {
            mainUser.groupMembersIds = [];
          }
          newUser.groupMembersIds = [...mainUser?.groupMembersIds, mainUser.id];
        }
      }
      // TODO:update User permission
      await permissionService.updatePermission(userExist.id, {
        permissions: userData.permissions,
      });
      const user = await userService.updateUser(userExist.id, newUser);
      if (userData.role !== UserRole.MASTER) {
        // TODO: send email as exisiting user like reset Password
        const userPortal =
          userData.role === UserRole.SUPER_ADMIN ? "admin" : userData.permissions.portalId;
        sendSetPasswordEmail(
          newUser.email,
          `${newUser.firstName} ${newUser.lastName}`.trim(),
          token,
          userPortal,
          true,
          from ? "" : "reset"
        );
      }
      if (mainUserRole === UserRole.SUPER_ADMIN && userData.role === UserRole.SUPER_ADMIN) {
        try {
          if (!mainUser.groupMembersIds) {
            mainUser.groupMembersIds = [];
          }

          if (mainUser.groupMembersIds.length > 0) {
            for (const id of mainUser.groupMembersIds) {
              const groupUser = await userService.getUserById(id);

              if (!groupUser) {
                continue;
              }

              if (!groupUser.groupMembersIds) {
                groupUser.groupMembersIds = [];
              }

              groupUser.groupMembersIds.push((user as any).id);
              await userService.updateUser(groupUser.id, {
                groupMembersIds: groupUser.groupMembersIds,
              });
            }
          }

          mainUser.groupMembersIds.push((user as any).id);
          await userService.updateUser(mainUser.id, {
            groupMembersIds: mainUser.groupMembersIds,
          });
        } catch (error) {
          throw new Error("Failed to update group member relationships.");
        }
      }
      console.log("Successfully saved new user");

      return res.status(200).json(user);
    }

    const token = await generateNanoToken();
    // Add new user with password
    let newUser: any = {
      // id: Date.now().toString(),
      email: userData.email,
      phoneNo: userData.phoneNo,
      firstName: userData.firstName || userData.email.split("@")[0],
      lastName: userData.lastName || "",
      password: userData.password, // Default password as requested
      extra: process.env.NODE_ENV === "development" ? userData.password : null, // Default password as requested
      company: {},
      collaborationIds: [],
      groupMembersIds: [],
      // createdAt: new Date().toISOString(),
      role: userData.role,
      permissions: [userData.permissions],
      ndaPages: userData.ndaPages || null,
    };

    if (
      userData.role !== UserRole.SUPER_ADMIN &&
      userData.role !== UserRole.MASTER
    ) {
      newUser.resetPasswordToken = token;
      newUser.isOnboardingRequired = userData.isOnboardingRequired;
      newUser.portalId = userData.portal;
      newUser.title = userData.title;
      newUser.boxUserId = userData.boxUserId;
      newUser.folderId = userData.folderId;
      newUser.company = {
        name: userData.companyName,
        logo: userData.logo,
      };
    } else if (userData.role === UserRole.SUPER_ADMIN) {
      newUser.resetPasswordToken = token;
      newUser.isOnboardingRequired = userData.isOnboardingRequired;
      newUser.boxUserId = userData.boxUserId;
      newUser.folderId = userData.folderId;
      newUser.company = {
        name: userData.companyName,
        logo: userData.logo,
      };
      if (mainUserRole === UserRole.SUPER_ADMIN) {
        if (!mainUser?.groupMembersIds) {
          mainUser.groupMembersIds = [];
        }
        newUser.groupMembersIds = [...mainUser?.groupMembersIds, mainUser.id];
      }
    }

    // console.log("Created new user object:", newUser);
    // users.push(newUser);

    // await writeUsers(users);
    const user = await userService.createUser(newUser);
    if (userData.role !== UserRole.MASTER) {
      // because super_admin will be created from admin so it should go to admin for set password
      const userPortal =
        userData.role === UserRole.SUPER_ADMIN ? "admin" : userData.portal;
      sendSetPasswordEmail(newUser.email, `${newUser.firstName} ${newUser.lastName}`.trim(), token, userPortal, false, from ? "" : "reset");
    }

    if (mainUserRole === UserRole.SUPER_ADMIN && userData.role === UserRole.SUPER_ADMIN) {
      try {
        if (!mainUser.groupMembersIds) {
          mainUser.groupMembersIds = [];
        }

        if (mainUser.groupMembersIds.length > 0) {
          for (const id of mainUser.groupMembersIds) {
            const groupUser = await userService.getUserById(id);

            if (!groupUser) {
              continue;
            }

            if (!groupUser.groupMembersIds) {
              groupUser.groupMembersIds = [];
            }

            groupUser.groupMembersIds.push((user as any).id);
            await userService.updateUser(groupUser.id, {
              groupMembersIds: groupUser.groupMembersIds,
            });
          }
        }

        mainUser.groupMembersIds.push((user as any).id);
        await userService.updateUser(mainUser.id, {
          groupMembersIds: mainUser.groupMembersIds,
        });
      } catch (error) {
        throw new Error("Failed to update group member relationships.");
      }
    }
    console.log("Successfully saved new user");

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return res.status(500).json({
      error: (error as Error).message,
      details: "Failed to save user",
    });
  }
});

const bulkCreateUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { createdBy, ...user } = req.body;
    const mainUser = await userService.getUserById(createdBy);
    let portalCreatedAdmin = null;

    if (!user.portal) {
      return res.status(400).json({ error: "portal is required" });
    }

    const users = [
      user,
      {
        email: `user_${user.email}`,
        name: "Demo User",
        title: "User",
        role: UserRole.USER,
        password: "000",
        logo: null,
        isOnboardingRequired: false,
        permissions: { portalId: user.portal, role: UserRole.USER },
        portalId: user.portal,
      },
      {
        email: "briana.walsh@moderator.com",
        name: "Briana Walsh",
        title: "Financial Advisor",
        role: UserRole.MODERATOR,
        password: "000",
        logo: null,
        isOnboardingRequired: false,
        permissions: { portalId: user.portal, role: UserRole.MODERATOR },
        portalId: user.portal,
      },
      {
        email: "mike.conti@user.com",
        name: "Mike Conti",
        title: "User",
        role: UserRole.USER,
        password: "000",
        logo: null,
        isOnboardingRequired: false,
        permissions: { portalId: user.portal, role: UserRole.USER },
        portalId: user.portal,
      },
    ];

    const createdResults = [];
    console.log("Creating portal folder structure for bulk users:", user.portal);
    const folderIds = await setupPortalFoldersForBulk(user.portal);
    console.log("Bulk portal folder ids:", folderIds);

    for (const userData of users) {
      try {
        const existingUser = await userService.getUserByEmail(userData.email);
        let boxUserId = "";
        let folderId = "";

        try {
          const boxUser = await ensureBoxUserAndFolder(
            userData.email,
            Boolean(userData?.from),
            folderIds,
          );
          boxUserId = boxUser?.boxUserId || "";
          folderId = boxUser?.folderId || "";
        } catch (error) {
          console.error(`Failed to create/get Box user for ${userData.email}:`, error);
        }

        const token = await generateNanoToken();
        // Portal row does not exist yet during portal setup — defer user_portals sync
        // until after POST /api/portal creates the portal.
        const preparedUser: any = {
          email: userData.email,
          phoneNo: userData.phoneNo || "",
          firstName: userData.name || userData.email.split("@")[0],
          lastName: userData.lastName || "",
          title: userData.title,
          password: userData.password || undefined,
          role: userData.role,
          boxUserId,
          folderId,
          company: {
            name: mainUser?.companyName || "Unknown",
            logo: userData.logo,
          },
          permissions: [userData.permissions],
          ndaPages: userData.ndaPages || null,
          resetPasswordToken: token,
          isOnboardingRequired: userData.isOnboardingRequired,
          createdBy,
          from: userData.from || null,
          skipUserPortalSync: true,
        };

        if (existingUser) {
          await permissionService.updatePermission(
            existingUser.id,
            { permissions: userData.permissions },
            { skipUserPortalSync: true },
          );
          const { password, permissions, skipUserPortalSync, ...updateData } =
            preparedUser;
          await userService.updateUser(existingUser.id, updateData);
          createdResults.push({ email: userData.email, status: "updated" });
          if (userData.from) {
            portalCreatedAdmin = existingUser;
          }
        } else {
          const created = await userService.createUser(preparedUser);
          const portal =
            userData.role === UserRole.SUPER_ADMIN
              ? "admin"
              : userData.permissions.portalId;

          if (userData.isOnboardingRequired) {
            sendSetPasswordEmail(
              preparedUser.email,
              preparedUser.firstName,
              preparedUser.resetPasswordToken,
              portal,
              false,
              userData.from ? "" : "reset",
            );
          }

          createdResults.push({
            email: userData.email,
            status: "created",
            userId: (created as any).id,
          });
          if (userData.from) {
            portalCreatedAdmin = created;
          }
        }
      } catch (userErr) {
        createdResults.push({
          email: userData.email,
          status: "error",
          error: (userErr as Error).message,
        });
        console.error(`Failed to create user ${userData.email}:`, userErr);
      }
    }

    return res.status(200).json({
      success: true,
      results: createdResults,
      data: portalCreatedAdmin,
      folderStructure: folderIds,
    });
  } catch (error) {
    console.error("Bulk user creation error:", error);
    return res.status(500).json({
      error: "Failed to create users",
      details: (error as Error).message,
    });
  }
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const userData = req.body;
    const user = await userService.setUserOnboarding(userData.id);
    await portalService.updatePortalStatus(user.portalId || "", "active");
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return res.status(500).json({
      error: "Failed to edit user",
      details: (error as Error).message,
    });
  }
});

const patchUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const body = req.body;
    const { id, portalId: bodyPortalId, portalid, role, ...updatedData } = body;

    if (!id) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const ndaPages = updatedData.ndaPages || null;
    const userFields = { ...updatedData, ndaPages };

    if (role !== undefined) {
      const existingUser = await userService.getUserById(id);
      const portalId =
        bodyPortalId ||
        portalid ||
        userFields.portal ||
        existingUser?.portalId;

      if (!portalId && role !== UserRole.SUPER_ADMIN && role !== UserRole.MASTER) {
        return res.status(400).json({
          error: "portalId is required to update role",
        });
      }

      const updatedUser = await permissionService.updatePermission(id, {
        ...userFields,
        permissions: {
          portalId: portalId ?? null,
          role,
        },
      });

      return res.status(200).json({
        message: "User updated successfully",
        user: updatedUser,
      });
    }

    const { role: _role, ...profileFields } = userFields;
    const updatedUser = await userService.updateUser(id, profileFields);

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in PATCH /api/users:", error);
    return res.status(500).json({
      error: "Failed to update user",
      details: (error as Error).message,
    });
  }
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { id, portalId } = req.body;
    if (!id || !portalId) {
      throw new Error("Invalid !! portalId is required field");
    }
    await taskService.deleteUserTasks(id, portalId);
    const removedPermission = await permissionService.removePermission(id, portalId);
    return res.status(200).json(removedPermission);
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    return res.status(500).json({
      error: "Failed to delete user",
      details: (error as Error).message,
    });
  }
});

const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { email, portalid, oldPassword, newPassword } = req.body;
    const user = await userService.getUserByEmail(email, portalid);
    if (!user) {
      return res.status(404).json({
        error: "Invalid credentials!! user not found with this email",
      });
    }
    const portalPermission = await userService.getUserPortalPermission(
      portalid ?? null,
      user.id,
    );

    if (!portalPermission) {
      return res.status(403).json({
        error: "This user does not have access to this portal",
      });
    }

    const isCorrectOldPassword = await bcrypt.compare(
      oldPassword,
      user?.password as string,
    );

    if (!isCorrectOldPassword) {
      return res.status(403).json({
        error: "Old password is wrong",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    const updatedUser = await userService.updateUser(user?.id, {
      extra: newPassword,
      password: password,
    });

    return res.status(200).json({
      message: "Password sent successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      error: "Email send failed: " + (error as Error).message,
    });
  }
});

const acceptTNC = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: "User ID is required.",
      });
    }

    await userService.updateUser(userId, { isTNCAccepted: true });
    return res.status(200).json("Terms and conditions accepted successfully");
  } catch (error) {
    console.error("Error in PUT /api/users/tncAccept:", error);
    return res.status(500).json({
      error: "Failed to edit user",
      details: (error as Error).message,
    });
  }
});

const updateRole = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const userData = req.body;
    console.log("Received userData:", userData);

    const role = userData.role;

    await permissionService.updatePermission(userData.id, {
      permissions: {
        portalId: userData.portalId,
        role,
      },
    });

    return res.status(200).json("Permission updated");
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return res.status(500).json({
      error: (error as Error).message,
      details: "Failed to edit user",
    });
  }
});

const resendInviteLink = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    const user = await userService.getUserByEmail(data.email);
    if (!user) {
      return res.status(404).json({
        error: "Invalid credentials!! user not found with this email",
      });
    }

    const portalPermission = await userService.getUserPortalPermission(
      data.portalid ?? null,
      user.id,
    );

    if (!portalPermission) {
      return res.status(403).json({
        error: "This user does not have access to this portal",
      });
    }

    const token = user?.resetPasswordToken
      ? user.resetPasswordToken
      : await generateNanoToken();

    await userService.setResetPasswordToken(user.email, token);

    if (
      portalPermission.role !== UserRole.SUPER_ADMIN &&
      portalPermission.role !== UserRole.MASTER
    ) {
      // Check if invite_link_email notification is enabled
      const isEmailEnabled = await notificationService.isNotificationEnabled(
        user.id,
        NotificationConfigure.INVITE_LINK_EMAIL,
      );

      if (isEmailEnabled) {
        sendSetPasswordEmail(
          user.email,
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          token,
          data.portalid,
          false,
          "reset",
        );
      } else {
        console.log(`Invite link email disabled for user ${user.id}, skipping email send`);
      }
    }

    return res.status(200).json({
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      error: "Email send failed: " + (error as Error).message,
    });
  }
});

const handleLoginByProvider = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const data = req.body;
      const user = await userService.getUserByEmail(data.email);
      if (!user) {
        return res.status(404).json({
          error: "Invalid credentials!! user not found with this email",
        });
      }
      let portalCreatedAdmin = null;
      if (data?.portalid && data.portalid !== "root") {
        try {
          portalCreatedAdmin = await portalService.getPortalCreatedAdmin(data.portalid);
        } catch (error) {
          console.warn(`Portal admin not found for portal: ${data.portalid}`);
        }
      }
      const portalPermission = await userService.getUserPortalPermission(
        data.portalid ?? null,
        user.id,
      );

      if (!portalPermission) {
        return res.status(403).json({
          error: "This user does not have access to this portal",
        });
      }

      const userRole = portalPermission.role;

      const userData = {
        id: user.id,
        email: user.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        role: userRole,
        company: user.company,
        isOnboardingRequired: user.isOnboardingRequired,
        boxUserId: user.boxUserId,
        // boxFolderId: user.folderId,
        collaborationIds: user.collaborationIds,
        signRequestsIds: user.signRequestsId,
        permissions: user.permissions,
      };

      if (portalCreatedAdmin && userRole !== UserRole.USER) {
        (userData as any).boxFolderId = portalCreatedAdmin?.folderId;
      } else {
        (userData as any).boxFolderId = user.folderId;
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: userRole,
        portalId: data?.portalid || "admin",
        boxUserId: user.boxUserId,
        folderId: (userData as any).boxFolderId,
      };

      const accessToken = await generateToken(tokenPayload, "168h");
      const refreshToken = await generateRefreshToken();
      await userService.setUserTokens(data.email, accessToken, refreshToken, "okta");
      const response = {
        success: true,
        user: userData,
        accessToken,
        refreshToken,
      };

      res.cookie("user", JSON.stringify(userData), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      res.cookie("token", accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        error: "Authentication failed: " + (error as Error).message,
      });
    }
  },
);

const getNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const preferences =
        await notificationService.getNotificationPreferences(userId);
      const availableTypes =
        notificationService.getAvailableNotificationTypes();

      return res.status(200).json({
        success: true,
        preferences,
        availableTypes,
      });
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      return res.status(500).json({
        error: "Failed to get notification preferences",
        details: (error as Error).message,
      });
    }
  }
);

const updateNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const userId = (req as any).user?.id;
      const { preferences } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (!preferences || typeof preferences !== "object") {
        return res.status(400).json({
          error: "preferences object is required",
        });
      }

      const updated =
        await notificationService.updateNotificationPreferences(
          userId,
          preferences
        );

      return res.status(200).json({
        success: true,
        preferences: updated,
        message: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return res.status(500).json({
        error: "Failed to update notification preferences",
        details: (error as Error).message,
      });
    }
  }
);

export default {
  getUsers,
  getCurrentUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  patchUser,
  deleteUser,
  updatePassword,
  acceptTNC,
  updateRole,
  resendInviteLink,
  handleLoginByProvider,
  getNotificationPreferences,
  updateNotificationPreferences,
};
