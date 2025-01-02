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
  const data = await req.json();
  console.log("data: ", data);
  let { legalName } = data;
  if (!legalName) {
    return NextResponse.json({ error: "Name are required" }, { status: 400 });
  }
  // legalName = sanitizeName(legalName);
  // const filePath = path.join(portalsDir, `${legalName}.config`);

  try {
    // await ensurePortalsDirectory();
    // try {
    // await fs.access(filePath);
    const portalExist = await portalService.getPortalByLegalName(legalName);
    if (portalExist) {
      return NextResponse.json(
        { error: `${legalName} already exists.` },
        { status: 409 }
      );
    }
    // } catch {
    //   // File does not exist, proceed to create it
    //   await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    //   console.log(`Config file ${legalName}.config created successfully.`);
    //   return NextResponse.json({
    //     message: `Config file ${legalName}.config created successfully.`,
    //   });
    // }
    const portal = await portalService.createPortal(data);
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
    const fileName = searchParams.get("portalid");

    // const files = await fs.readdir(portalsDir);
    // const portalFiles = files.filter((file) => file.endsWith(".config"));

    // if (fileName) {
    //   const sanitizedFileName = fileName.endsWith(".config")
    //     ? fileName
    //     : `${fileName}.config`;
    //   if (portalFiles.includes(sanitizedFileName)) {
    //     const filePath = path.join(portalsDir, sanitizedFileName);
    //     const fileContent = await fs.readFile(filePath, "utf8");
    //     return NextResponse.json({
    //       message: `File ${sanitizedFileName} retrieved successfully.`,
    //       data: JSON.parse(fileContent),
    //     });
    //   } else {
    //     return NextResponse.json(
    //       { error: `File ${sanitizedFileName} not found.` },
    //       { status: 404 }
    //     );
    //   }
    // }

    // const portalData = {};
    // for (const file of portalFiles) {
    //   const filePath = path.join(portalsDir, file);
    //   const fileContent = await fs.readFile(filePath, "utf8");
    //   portalData[file] = JSON.parse(fileContent);
    // }
    const portalLegalName = reverseSanitizeName(fileName);
    const portal = await portalService.getPortalByLegalName(portalLegalName);
    if (!portal) {
      return NextResponse.json(
        { error: `portal ${fileName} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `portal retrieved successfully.`,
      data: portal,
    });
  } catch (error) {
    console.error("Error fetching portal files:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve portal files.", details: error.message },
      { status: 500 }
    );
  }
}
