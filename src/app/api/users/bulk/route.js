import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import { logApiCall } from "@/app/lib/api-log-middleware";
import userService from "@/services/userService";
import { generateNanoToken } from "@/app/lib/jwt";
import permissionService from "@/services/permissionService";
import { sendSetPasswordEmail } from "@/app/lib/email";
import { UserRole } from "@/config/constants";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
  },
});
const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

// Helper: Create or get Box user and folder
async function ensureBoxUserAndFolder(name) {
  const existing = await client.enterprise.getUsers({
    filter_term: name,
    fields: "id,name,login",
  });
  const boxUser = existing.entries?.length > 0 ? existing.entries[0] : null;

  if (!boxUser) {
    const newAppUser = await client.enterprise.addAppUser(name, {
      external_app_user_id: Date.now().toString(),
      is_platform_access_only: true,
    });
    const folder = await client.folders.create(
      "0",
      `${newAppUser.name}'s Files`
    );
    await client.collaborations.createWithUserID(
      newAppUser.id,
      folder.id,
      client.collaborationRoles.EDITOR
    );
    return { boxUserId: newAppUser.id, folderId: folder.id };
  }

  const search = await client.search.query(`${boxUser.name}'s Files`, {
    type: "folder",
    fields: "id",
  });
  const folderId =
    search.entries[0]?.id ||
    (await client.folders.create("0", `${boxUser.name}'s Files`)).id;
  return { boxUserId: boxUser.id, folderId };
}

// Helper: Create full user object
async function prepareUserData(mainUser, userData, createdBy) {
  const { boxUserId, folderId } = await ensureBoxUserAndFolder(userData.email);
  const token = await generateNanoToken();

  return {
    email: userData.email,
    phoneNo: userData.phoneNo || "",
    name: userData.name || userData.email.split("@")[0],
    title: userData.title,
    password: userData.password || undefined,
    role: userData.role,
    boxUserId,
    folderId,
    company: {
      name: mainUser.companyName || "Unknown",
      logo: userData.logo,
    },
    permissions: [userData.permissions],
    ndaPages: userData.ndaPages || null,
    resetPasswordToken: token,
    isOnboardingRequired: userData.isOnboardingRequired,
    createdBy,
    from: userData.from || null,
  };
}

export async function POST(req) {
  try {
    await logApiCall(req);
    const { createdBy, ...user } = await req.json();
    const mainUser = await userService.getUserById(createdBy);
    let portalCreatedAdmin;

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
        portalId: user.portal
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
        portalId: user.portal
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
        portalId: user.portal
      },
    ];

    const createdResults = [];

    for (const userData of users) {
      try {
        const existingUser = await userService.getUserByEmail(userData.email);
        const preparedUser = await prepareUserData(
          mainUser,
          userData,
          createdBy
        );

        if (existingUser) {
          await permissionService.updatePermission(existingUser.id, {
            permissions: userData.permissions,
          });
          let { password, permissions, ...updateData } = preparedUser;
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
              preparedUser.name,
              preparedUser.resetPasswordToken,
              portal,
              false,
              userData.from ? "" : "reset"
            );
          }

          createdResults.push({
            email: userData.email,
            status: "created",
            userId: created.id,
          });
          if (userData.from) {
            portalCreatedAdmin = created;
          }
        }
      } catch (userErr) {
        createdResults.push({
          email: userData.email,
          status: "error",
          error: userErr.message,
        });
        console.error(`Failed to create user ${userData.email}:`, userErr);
      }
    }

    return NextResponse.json({
      success: true,
      results: createdResults,
      data: portalCreatedAdmin,
    });
  } catch (err) {
    console.error("Bulk user creation error:", err);
    return NextResponse.json(
      { error: "Failed to create users" },
      { status: 500 }
    );
  }
}
