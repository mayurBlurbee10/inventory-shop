import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import portalService from "@/services/portalService";
import userService from "@/services/userService";
import { PluginType, UserRole } from "@/config/constants";
import permissionService from "@/services/permissionService";
import pluginService from "@/services/pluginService";
import pageService from "@/services/pageService";
import { existingPages } from "@/app/lib/data/existingPages";

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

  let { legalName, domain, createdBy, existingPortal } = data;
  console.log("legalName: ", legalName);

  if (!legalName || !data.id || !domain || !createdBy) {
    return NextResponse.json({ error: "Company Name and Domain Setup fields required" }, { status: 400 });
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
    const { id, createdAt, updatedAt, ...rest } = portalExist;
    const portalData = {
      ...rest,
      legalName: legalName,
      domain: domain,
      createdBy: createdBy,
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

    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      PluginType.PAGES,
      sanitizeName(existingPortal)
  );

    const pages = pluginExist[0].pages.filter((page)=> !page.isCustomPage);

    const filterPageVisibility = (pageTitle)=>{
      const page = pages.find((page)=>page.title === pageTitle)
      return page.isPageVisible
    }

    const plugin = await pluginService.createPlugin({
      type: PluginType.PAGES,
      portalId: sanitizeName(legalName),
      createdBy: createdBy,
    });
    
    const items = existingPages;
    let results = [];
    let errors = [];

    for (const item of items) {
      try {
        const pageExist = await pageService.checkIfPageWithTitleExist(
          sanitizeName(legalName),
          item.title
        );
        if (pageExist) {
          const pageUpdated = await pageService.updatePage(pageExist.id, {
            isPageVisible : filterPageVisibility(item.title)
          })
          results.push(pageUpdated);
          continue;
        }
        const obj = {
          title: item.title,
          description: item.description,
          isCustomPage: false,
          visibility: item.sections,
          plugin: plugin?.id,
          isPageVisible : filterPageVisibility(item.title)
        };
        const page = await pageService.createPage(obj);
        if (!page) {
          throw new Error(`Page can't created with ${item}`);
        }
        results.push(page);
      } catch (error) {
        errors.push(error.message);
      }
    }

    return NextResponse.json({
      message: `portal created successfully.`,
      data: portal,
      user : results
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create config file.", details: error.message },
      { status: 500 }
    );
  }
}
