import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import portalService from "@/services/portalService";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";
import permissionService from "@/services/permissionService";

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
  const data = await req.json();
  console.log("data: ", data);

  let { legalName, tradingName, domain } = data;
  console.log("legalName: ", legalName);

  if (!legalName || !data.id || !tradingName || !domain) {
    return NextResponse.json({ error: "Name are required" }, { status: 400 });
  }

  try {
    const portalExist = await portalService.getPortalById(data.id);
    console.log("portalExist: ", portalExist);
    if (!portalExist) {
      return NextResponse.json(
        { error: `${legalName} already exists.` },
        { status: 409 }
      );
    }
    const { id, ...rest } = portalExist;
    const portalData = {
      ...rest,
      legalName: legalName,
      tradingName: tradingName,
      domain: domain,
      status: "setup",
    };
    const portal = await portalService.createPortal(portalData);
    console.log("portal post: ", portal);
    if (!portal) {
      return NextResponse.json(
        { error: `portal ${legalName} not found.` },
        { status: 404 }
      );
    }

    console.log("portal.portalCreatedAdmin", portal.portalCreatedAdmin);
    let adminUser;
    if(portal.portalCreatedAdmin){
        adminUser = await permissionService.updatePermission(
          portal.portalCreatedAdmin,
          { permissions: { portalId: sanitizeName(legalName), role: "admin" } }
        );
    }
    return NextResponse.json({
      message: `portal created successfully.`,
      data: portal,
      user : adminUser
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create config file.", details: error.message },
      { status: 500 }
    );
  }
}
