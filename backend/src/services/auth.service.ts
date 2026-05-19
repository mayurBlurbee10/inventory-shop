import * as bcrypt from "bcrypt";
import { getBoxClient } from "../utils/box.ts";
import userService from "./user.service.ts";
import { UserRole } from "../config/constants.ts";
import { generateNanoToken, generateToken } from "../utils/jwt.ts";

const createHttpError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

function sanitizeUserResponse(user: any) {
  if (!user) return null;
  const plain = JSON.parse(JSON.stringify(user));
  delete plain.password;
  delete plain.extra;
  delete plain.accessToken;
  delete plain.resetPasswordToken;
  return plain;
}

const createBoxAppUser = async ({
  userName,
  externalId,
}: {
  userName: string;
  externalId: string;
}) => {
  const client = getBoxClient();

  const user = await client.enterprise.getUsers({
    filter_term: userName,
    fields: "id,name,login",
  });

  if (user?.entries?.length > 0) {
    const folder = await client.search.query(`"${userName}'s Files"`, {
      type: "folder",
      fields: "id",
    });

    if (!folder?.entries?.length) {
      const newFolder = await client.folders.create("0", `${userName}'s Files`);
      return {
        userId: user.entries[0].id,
        folderId: newFolder.id,
      };
    }

    return {
      userId: user.entries[0].id,
      folderId: folder.entries[0].id,
    };
  }

  const appUser = await client.enterprise.addAppUser(userName, {
    external_app_user_id: externalId,
    is_platform_access_only: true,
  });

  const folder = await client.folders.create("0", `${appUser.name}'s Files`);

  await client.collaborations.createWithUserID(
    appUser.id,
    folder.id,
    (client as any).collaborationRoles.EDITOR
  );

  return {
    userId: appUser.id,
    folderId: folder.id,
  };
};

const register = async (body: any) => {
  const { companyName, firstName, lastName, email, phone, title, portal } = body;

  if (!firstName || !lastName || !email || !companyName) {
    throw createHttpError("Missing required fields", 400);
  }

  const portalId = portal || "root";

  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    throw createHttpError("User with this email already exists", 409);
  }

  let boxUser: { userId: string; folderId: string };
  try {
    boxUser = await createBoxAppUser({
      userName: email,
      externalId: `user_${Date.now()}`,
    });
  } catch (boxError) {
    throw createHttpError(
      (boxError as Error)?.message ||
        "Could not create Box account. Please try again later.",
      502
    );
  }

  const resolvedTitle = (title && String(title).trim()) || "User";
  const resetPasswordToken = await generateNanoToken();

  const newUser = {
    email,
    phoneNo: phone ? String(phone).trim() : null,
    firstName,
    lastName,
    password: null,
    company: { name: companyName },
    collaborationIds: [],
    groupMembersIds: [],
    role: UserRole.USER,
    permissions: [
      {
        portalId: portalId,
        role: UserRole.USER,
      },
    ],
    portalId,
    title: resolvedTitle,
    boxUserId: boxUser.userId,
    folderId: boxUser.folderId,
    isOnboardingRequired: false,
    isTNCAccepted: false,
    authStrategy: "email",
    resetPasswordToken,
  };

  const saved: any = await userService.createUser(newUser);
  const userData = {
    id: saved.id,
    portalId: saved?.portalId || portalId,
    email: saved.email,
    role: saved?.role,
    boxUserId: saved.boxUserId,
    boxFolderId: saved.folderId,
  };

  const accessToken = await generateToken(userData, "168h");
  await userService.setUserAccessToken(saved.email, accessToken);

  return {
    saved,
    userData,
    accessToken,
  };
};

const setPassword = async (body: any) => {
  const { userId, password } = body;

  if (!userId || !password) {
    throw createHttpError("User ID and password are required", 400);
  }

  if (password.length < 8) {
    throw createHttpError("Password must be at least 8 characters long", 400);
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw createHttpError(
      "Password must contain uppercase, lowercase, and numbers",
      400
    );
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    throw createHttpError("User not found", 404);
  }

  if (user.password) {
    throw createHttpError("Password has already been set for this user", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const updated = await userService.updateUser(userId, {
    password: hashedPassword,
  });

  return sanitizeUserResponse(updated);
};

export default {
  register,
  setPassword,
};
