import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import {
  generateNanoToken,
  generateToken,
} from "../utils/jwt.ts";
import { sendSetPasswordEmail } from "../utils/email.ts";
import userService from "../services/user.service.ts";
import {
  UserRole,
  ApplicationStatus,
  OnboardingTasksType,
} from "../config/constants.ts";
import permissionService from "../services/permission.service.ts";
import portalService from "../services/portal.service.ts";
import * as bcrypt from "bcrypt";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/box.ts";
import { checklistFolders, FolderItem } from "../utils/data/folderStructure.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";
// userApplicationService, applicationService, userPortalService were removed
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { steps, tasks } from "../utils/data/onboarding.ts";
// onboardingStepService, onboardingTaskService, advisorService were removed
import taskService from "../services/task.service.ts";
import * as boxService from "../services/box.service.ts";
import Bottleneck from "bottleneck";

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
        const parentFolder = await client.folders.create(
          parentFolderId,
          sanitizedFolderName,
          {
            fields: "id,name,path_collection,created_at",
          } as any,
        );

        console.log(
          `Created folder: ${sanitizedFolderName} with ID: ${parentFolder.id}`,
        );

        // Create child folders if they exist
        if (folderItem.children && folderItem.children.length > 0) {
          for (const child of folderItem.children) {
            try {
              // Sanitize child folder name before creating
              const sanitizedChildName = sanitizeFolderName(child.title);

              const childFolder = await client.folders.create(
                parentFolder.id,
                sanitizedChildName,
                {
                  fields: "id,name,path_collection,created_at",
                } as any,
              );

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

  const uploadedFileRes = await client.files.uploadFile(
    folderId,
    `${label}.pdf`,
    fileStream,
  );

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
        const stepFolder = (await limiter.schedule(() => client.folders.create(
          userFolderId,
          step.label,
        ))) as any;

        // onboardingStepService and onboardingTaskService were removed
        const onboardStep: any = null;

        // ✅ Create Tasks Under Step
        await Promise.all(
          (tasks ?? []).map(async (task) => {
            const taskFolder = (await limiter.schedule(() => client.folders.create(
              stepFolder.id,
              task.label,
            ))) as any;

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

    const userPermission =
      Array.isArray(mainUser.permissions) &&
      mainUser.permissions.find(
        (permission: any) => permission.portalId === userData?.portal,
      );

    let mainUserRole = userPermission?.role;

    if (!userPermission) {
      const superUserPermission =
        Array.isArray(mainUser.permissions) &&
        mainUser.permissions.find(
          (permission: any) => permission.portalId === null,
        );
      mainUserRole = superUserPermission?.role;
    }

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

    for (const userData of users) {
      try {
        const existingUser = await userService.getUserByEmail(userData.email);
        let boxUserId = "";
        let folderId = "";

        try {
          const boxUser = await boxService.createBoxAppUser({
            userName: userData.email,
            externalId: Date.now().toString(),
          });
          boxUserId = boxUser?.userId || "";
          folderId = boxUser?.folderId || "";
        } catch (error) {
          console.error(`Failed to create/get Box user for ${userData.email}:`, error);
        }

        const token = await generateNanoToken();
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
        };

        if (existingUser) {
          await permissionService.updatePermission(existingUser.id, {
            permissions: userData.permissions,
          });
          const { password, permissions, ...updateData } = preparedUser;
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
    });
  } catch (error) {
    console.error("Bulk user creation error:", error);
    return res.status(500).json({
      error: "Failed to create users",
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
    const { id, ...updatedData } = body;

    if (!id) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const updatedUser = await userService.updateUser(id, {
      ...updatedData,
      ndaPages: updatedData.ndaPages || null,
    });

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
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find((permission: any) => permission.portalId === portalid);

    if (!userPermission) {
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
    const user = await userService.getUserById(userData.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const permission = user.permissions.find(
      (item: any) => item.portalId === userData.portalId,
    );

    if (permission) {
      permission.role = role;
    } else {
      return res.status(404).json({
        error: "Permission not found for the provided portalId",
      });
    }

    await permissionService.updatePermission(userData.id, { permissions: permission });

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

    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find(
        (permission: any) => permission.portalId === data.portalid,
      );

    if (!userPermission) {
      return res.status(403).json({
        error: "This user does not have access to this portal",
      });
    }

    const token = user?.resetPasswordToken
      ? user.resetPasswordToken
      : await generateNanoToken();

    await userService.setResetPasswordToken(user.email, token);

    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.MASTER) {
      sendSetPasswordEmail(
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        token,
        userPermission.portalId,
        false,
        "reset",
      );
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
      let userRole;
      const userPermission =
        Array.isArray(user.permissions) &&
        user.permissions.find(
          (permission: any) => permission.portalId === data.portalid,
        );
      if (!userPermission) {
        const userIsSuperAdminPermission =
          Array.isArray(user.permissions) &&
          user.permissions.find(
            (permission: any) => permission.role === UserRole.SUPER_ADMIN,
          );
        if (userIsSuperAdminPermission) {
          userRole = userIsSuperAdminPermission.role;
        } else {
          return res.status(403).json({
            error: "This user does not have access to this portal",
          });
        }
      } else {
        userRole = userPermission?.role;
      }

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

      if (portalCreatedAdmin) {
        (userData as any).boxFolderId = (portalCreatedAdmin as any)?.folderId;
      } else {
        (userData as any).boxFolderId = (user as any).folderId;
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: userRole,
        portalId: (userPermission as any)?.portalId || "admin",
        boxUserId: user.boxUserId,
        folderId: (userData as any).boxFolderId,
      };

      const accessToken = await generateToken(tokenPayload, "168h");
      await userService.setUserAccessToken(data.email, accessToken, "okta");
      const response = {
        success: true,
        user: userData,
        accessToken,
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

      return res.status(200).json(response);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        error: "Authentication failed: " + (error as Error).message,
      });
    }
  },
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
};
