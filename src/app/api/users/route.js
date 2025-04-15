// src/app/api/users/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { generateNanoToken } from "@/app/lib/jwt";
import { sendSetPasswordEmail } from "@/app/lib/email";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";
import permissionService from "@/services/permissionService";
import portalService from "@/services/portalService";
import taskService from "@/services/taskService";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

// Ensure the data directory exists
async function ensureDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
    console.log("Data directory exists:", dataDir);
  } catch {
    console.log("Creating data directory:", dataDir);
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Helper to read the current users
async function readUsers() {
  try {
    console.log("Reading users from:", dataFilePath);
    const data = await fs.readFile(dataFilePath, "utf8");
    console.log("Current users data:", data);
    return JSON.parse(data);
  } catch (error) {
    console.log("Error reading users file (or file not found):", error.message);
    console.log("Initializing with empty array");
    return [];
  }
}

// Helper to write users
async function writeUsers(users) {
  try {
    await ensureDirectory();
    console.log("Writing users to file:", users);
    await fs.writeFile(dataFilePath, JSON.stringify(users, null, 2));
    console.log("Successfully wrote users to file");
  } catch (error) {
    console.error("Error writing users to file:", error);
    throw error;
  }
}

export async function GET(request) {
  console.log("GET request received for users");
  await logApiCall(request);
  const { searchParams } = new URL(request.url);
  const portalid = searchParams.get("portalid");
  const email = searchParams.get("email");
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");
  const boxUserId = searchParams.get("boxUserId");
  const check = searchParams.get("check");

  try {
    let users = {};
  if (portalid) {
    users = await userService.getUsersByPortal(portalid);
  } else if (email && check) {
    users = await userService.getPortalCreateAdminByEmail(email);
  } else if (email) {
    users = await userService.getUserByEmail(email);
  }  else if (role) {
    users = await userService.getUserByRole(role, userId);
  } else if(boxUserId){
    users = await userService.getUserByBoxUserId(boxUserId)
  } else if (userId) { 
    users = await userService.getUserById(userId);
  } else {
    users = await userService.getUsers();
  }

  return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
}

export async function POST(request) {
  console.log("POST request received for users");
  try {
    await logApiCall(request);
    const data = await request.json();
    const { from=null , ...userData } = data;
    console.log("Received user data:", userData);

    // if (!userData.email || !userData.boxUserId || !userData.folderId) {
    //   console.log("Missing required fields:", userData);
    //   return NextResponse.json(
    //     { error: "Missing required fields" },
    //     { status: 400 }
    //   );
    // }

    // const users = await readUsers();
    // console.log('Current users count:', users.length);

    // Check if user already exists
    // if (users.some(user => user.email === userData.email)) {
    //   console.log('User already exists:', userData.email);
    //   return NextResponse.json(
    //     { error: 'User already exists' },
    //     { status: 409 }
    //   );
    // }
    const userExist = await userService.getUserByEmail(userData.email);
    const mainUser = await userService.getUserById(userData.createdBy);
    const userPermission =
      Array.isArray(mainUser.permissions) &&
      mainUser.permissions.find(
        (permission) => permission.portalId === userData?.portal
      );

    let mainUserRole = userPermission?.role;

    if (!userPermission) {
      const superUserPermission =
        Array.isArray(mainUser.permissions) &&
        mainUser.permissions.find((permission) => permission.portalId === null);

        mainUserRole = superUserPermission?.role;
    }

    if (userExist) {
      console.log("userExist", userExist);
      const token = await generateNanoToken();
      let newUser = {
        email: userData.email,
        name: userData.name || userData.email.split("@")[0],
        role: userData.role,
        phoneNo: userData.phoneNo,
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
          newUser.name,
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

              groupUser.groupMembersIds.push(user.id);
              await userService.updateUser(groupUser.id, {
                groupMembersIds: groupUser.groupMembersIds,
              });
            }
          }

          mainUser.groupMembersIds.push(user.id);
          await userService.updateUser(mainUser.id, {
            groupMembersIds: mainUser.groupMembersIds,
          });
        } catch (error) {
          throw new Error("Failed to update group member relationships.");
        }
      }
      console.log("Successfully saved new user");

      return NextResponse.json(user);
    }

    const token = await generateNanoToken();
    // Add new user with password
    let newUser = {
      // id: Date.now().toString(),
      email: userData.email,
      phoneNo: userData.phoneNo,
      name: userData.name || userData.email.split("@")[0],
      password: userData.password, // Default password as requested
      extra: process.env.NODE_ENV === "development" ? userData.password : null, // Default password as requested
      company: {},
      collaborationIds: [],
      groupMembersIds: [],
      // createdAt: new Date().toISOString(),
      role: userData.role,
      permissions: [userData.permissions],
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
        sendSetPasswordEmail(newUser.email, newUser.name, token, userPortal, false, from ? "" : "reset");
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

            groupUser.groupMembersIds.push(user.id);
            await userService.updateUser(groupUser.id, {
              groupMembersIds: groupUser.groupMembersIds,
            });
          }
        }

        mainUser.groupMembersIds.push(user.id);
        await userService.updateUser(mainUser.id, {
          groupMembersIds: mainUser.groupMembersIds,
        });
      } catch (error) {
        throw new Error("Failed to update group member relationships.");
      }
    }
    console.log("Successfully saved new user");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: error.message, details: "Failed to save user" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await logApiCall(request);
    const userData = await request.json();
    const user = await userService.setUserOnboarding(userData.id);
    await portalService.updatePortalStatus(user.portalId, "active");
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return NextResponse.json(
      { error: "Failed to edit user", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await logApiCall(request);

    const body = await request.json();
    const { id, ...updatedData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await userService.updateUser(id, updatedData);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error in PATCH /api/users:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await logApiCall(request);
    const { id, portalId } = await request.json();
    if (!id || !portalId) {
      throw new Error("Invalid !! portalId is required field");
    }
    await taskService.deleteUserTasks(id, portalId);
    const res = await permissionService.removePermission(id, portalId);
    return NextResponse.json(res);
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
