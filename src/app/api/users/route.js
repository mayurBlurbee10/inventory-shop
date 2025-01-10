// src/app/api/users/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { generateNanoToken } from "@/app/lib/jwt";
import { sendSetPasswordEmail } from "@/app/lib/email";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";

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
  let users = {};
  if (portalid) {
    users = await userService.getUsersByPortal(portalid);
  } else if (email) {
    users = await userService.getUserByEmail(email);
  } else {
    users = await userService.getUsers();
  }

  return NextResponse.json(users);
}

export async function POST(request) {
  console.log("POST request received for users");
  try {
    await logApiCall(request);
    const userData = await request.json();
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
    if (userExist) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const token = await generateNanoToken();
    // Add new user with password
    let newUser = {
      // id: Date.now().toString(),
      email: userData.email,
      name: userData.name || userData.email.split("@")[0],
      password: userData.password, // Default password as requested
      extra: userData.password, // Default password as requested
      company: {},
      collaborationIds: [],
      // createdAt: new Date().toISOString(),
      role: userData.role,
    };

    if (userData.role !== UserRole.SUPER_ADMIN) {
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
    }

    // console.log("Created new user object:", newUser);
    // users.push(newUser);

    // await writeUsers(users);
    const user = await userService.createUser(newUser);
    if (userData.role !== UserRole.SUPER_ADMIN)
      sendSetPasswordEmail(newUser.email, newUser.name, token, userData.portal);
    console.log("Successfully saved new user");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Failed to save user", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await logApiCall(request);
    const userData = await request.json();
    const user = await userService.setUserOnboarding(userData.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return NextResponse.json(
      { error: "Failed to edit user", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await logApiCall(request);
    const userData = await request.json();
    const res = await userService.deleteUser(userData.id);
    return NextResponse.json(res);
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
