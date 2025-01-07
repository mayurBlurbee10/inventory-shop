import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { logApiCall } from "@/app/lib/api-log-middleware";
import portalService from "@/services/portalService";

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
  console.log('legalName: ', legalName)
  if (!legalName) {
    return NextResponse.json({ error: "Name are required" }, { status: 400 });
  }

  try {
    const portalExist = await portalService.getPortalByLegalName(legalName);
    console.log('portalExist: ', portalExist)
    if (portalExist) {
      return NextResponse.json(
        { error: `${legalName} already exists.` },
        { status: 409 }
      );
    }
    const portal = await portalService.createPortal(data);
    console.log('portal post: ', portal)
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
    await ensurePortalsDirectory();

    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalid");
    console.log('portalId get: ', portalId)
    if (!!portalId) {
      const portalLegalName = reverseSanitizeName(portalId);
      const portal = await portalService.getPortalByLegalName(portalLegalName);
      console.log('if portal: ', JSON.stringify(portal))
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
    } else {
      const portals = await portalService.getPortals();
      console.log('else portals: ', JSON.stringify(portals))
      return NextResponse.json({
        message: `portals retrieved successfully.`,
        data: portals
      })
    }
  } catch (error) {
    console.error("Error fetching portal files:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve portal files.", details: error.message },
      { status: 500 }
    );
  }
}
