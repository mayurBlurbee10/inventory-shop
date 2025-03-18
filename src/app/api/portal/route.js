import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logApiCall } from "@/app/lib/api-log-middleware";
import portalService from "@/services/portalService";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";
import permissionService from "@/services/permissionService";

const portalsDir = path.join(process.cwd(), "public", "portals");

async function ensurePortalsDirectory() {
  try {
    await fs.access(portalsDir);
    console.log("Portals directory exists:", portalsDir);
  } catch {
    console.log("Creating portals directory:", portalsDir);
    await fs.mkdir(portalsDir, { recursive: true });
  }
}

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

function reverseSanitizeName(sanitizedName) {
  // If the sanitized name ends with a hyphen, remove it
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  // Replace hyphens with spaces
  reversedName = reversedName.replace(/-/g, " ");

  // Capitalize the first letter of each word
  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Return the reconstructed name
  return reversedName;
}

// Create or update the config file
export async function POST(req) {
  await logApiCall(req);
  await ensurePortalsDirectory();
  const data = await req.json();
  console.log("data: ", data);
  let { legalName } = data;
  console.log("legalName: ", legalName);
  if (!legalName) {
    return NextResponse.json({ error: "Name are required" }, { status: 400 });
  }

  try {
    const portalExist = await portalService.getPortalByLegalName(legalName);
    console.log("portalExist: ", portalExist);
    if (portalExist) {
      return NextResponse.json(
        { error: `${legalName} already exists.` },
        { status: 409 }
      );
    }
    const portal = await portalService.createPortal(data);
    console.log("portal post: ", portal);
    if (!portal) {
      return NextResponse.json(
        { error: `portal ${legalName} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `portal created successfully.`,
      data: portal,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create config file.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await logApiCall(req);

    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalid");
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!!portalId) {
      const portalLegalName = reverseSanitizeName(portalId);
      const portal = await portalService.getPortalByLegalName(portalLegalName);
      if (!portal) {
        return NextResponse.json(
          { error: `portal ${portalId} not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: `portal retrieved successfully.`,
        data: portal,
      });
    } else if (!!userId) {
      let allPortals = [];
      let userCount = 0;
      const User = await userService.getUserById(userId);
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
      return NextResponse.json({
        message: `portals retrieved successfully.`,
        data: { portals: allPortals, activeUsers: userCount },
      });
    }else if (!!id) {
      const portal = await portalService.getPortalById(id);
      return NextResponse.json({
        message: `portal retrieved successfully.`,
        data: portal,
      });
    } else {
      const portals = await portalService.getPortals();
      return NextResponse.json({
        message: `portals retrieved successfully.`,
        data: portals,
      });
    }
    
  } catch (error) {
    console.error("Error fetching portal files:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve portal files.", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await logApiCall(req);
    const portalData = await req.json();
    const portal = await portalService.updatePortalThemes(portalData);
    return NextResponse.json({
      message: `portal updated successfully.`,
      data: portal,
    });
  } catch (error) {
    console.error("Error update portal:", error.message);
    return NextResponse.json(
      { error: "Failed to update portal.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    // Log the API call
    await logApiCall(req);

    // Parse request body
    const { id } = await req.json();

    // Retrieve portal by ID
    const portal = await portalService.getPortalById(id);
    if (!portal) {
      return NextResponse.json({ error: "Portal not found." }, { status: 404 });
    }

    // Retrieve users associated with the portal
    const portalUsers = await userService.getUsersByPortal(
      sanitizeName(portal.legalName)
    );

    // Validate portal users and delete non-SUPER_ADMIN users
    const deletionPromises = portalUsers
      .filter((user) => user?.role !== UserRole.SUPER_ADMIN && user?.id)
      .map((user) => {
        if (!user.id) {
          console.warn(
            `Skipping user with invalid ID: ${JSON.stringify(user)}`
          );
          return Promise.resolve();
        }
        return permissionService
          .removePermission(user.id, sanitizeName(portal.legalName))
          .catch((error) => {
            console.error(
              `Failed to delete user with ID ${user.id}:`,
              error.message
            );
            throw new Error(`Failed to delete user: ${user.id}`);
          });
      });

    await Promise.all(deletionPromises);

    // Fetch users after deletion for validation/debugging
    const portalUsersAfterDelete = await userService.getUsersByPortal(
      sanitizeName(portal.legalName)
    );

    // Delete the portal
    await portalService.deletePortal(portal.id);

    // Return success response
    return NextResponse.json({
      message: "Portal deleted successfully.",
      data: portalUsers,
      dataAfterDelete: portalUsersAfterDelete,
    });
  } catch (error) {
    console.error("Error deleting portal:", error);
    return NextResponse.json(
      { error: "Failed to delete portal.", details: error.message },
      { status: 500 }
    );
  }
}
