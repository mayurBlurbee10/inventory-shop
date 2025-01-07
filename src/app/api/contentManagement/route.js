import {
  ensureDirectory,
  logApiCall,
  readJsonFile,
  writeJsonFile,
} from "@/app/lib/api-log-middleware";
import contentManagementService from "@/services/contentManagementService";
import { NextResponse } from "next/server";
import path from "path";
const dir = path.join(process.cwd(), "src", "app", "data");
const filePath = path.join(dir, "content-management.json");
const formatDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
};

export async function POST(request) {
  try {
    await logApiCall(request);
    const contentData = await request.json();
    console.log(contentData);
    if (
      !contentData.title ||
      !contentData.type ||
      !contentData.value ||
      !contentData.portalId
    ) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, value" },
        { status: 400 }
      );
    }
    // await ensureDirectory(dir);
    // const contentItems = await readJsonFile(filePath);
    const contentItems = await contentManagementService.getContentManagement(
      contentData.portalId
    );
    const existingIndex = contentItems.findIndex(
      (item) => item.title === contentData.title
    );
    if (existingIndex > -1) {
      await contentManagementService.removeOldEntry(contentItems[existingIndex])
    }

    // const portalexist = contentItems.findIndex(
    //   (item) => item.key === contentData.portal
    // );
    // const existingIndex = contentItems[portalexist]["value"].findIndex(
    //   (item) => item.title === contentData.title
    // );
    // if (portalexist !== -1) {
    //   if (existingIndex !== -1) {
    //     contentItems[portalexist]["value"][existingIndex] = {
    //       ...contentItems[portalexist]["value"][existingIndex],
    //       lastUpdated: formatDate(),
    //       title: contentData.title,
    //       type: contentData.type,
    //       value: contentData.value,
    //     };
    //   } else {
    //     const newContentItem = {
    //       id: Date.now().toString(),
    //       title: contentData.title,
    //       type: contentData.type,
    //       value: contentData.value,
    //       lastUpdated: formatDate(),
    //     };
    //     contentItems[portalexist]["value"].push(newContentItem);
    //   }
    // } else {
    //   const newContentItem = {
    //     id: Date.now().toString(),
    //     title: contentData.title,
    //     type: contentData.type,
    //     value: contentData.value,
    //     lastUpdated: formatDate(),
    //   };
    //   const newContent = [];
    //   newContent.push(newContentItem);
    //   contentItems.push({ key: contentData.portal, value: newContent });
    // }
    // await writeJsonFile(dir, filePath, contentItems);
    // return NextResponse.json(
    //   existingIndex !== -1
    //     ? contentItems[portalexist]["value"][existingIndex]
    //     : contentItems[portalexist]["value"][
    //         contentItems[portalexist]["value"].length - 1
    //       ],
    //   { status: 201 }
    // );
    const contentUpdated =
      await contentManagementService.createContentManagement(contentData);
    return NextResponse.json(contentUpdated, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/content:", error);
    return NextResponse.json(
      { error: "Failed to save content item", details: error.message },
      { status: 500 }
    );
  }
}
export async function GET(request) {
  try {
    await logApiCall(request);
    const { searchParams } = new URL(request.url);
    const portalId = searchParams.get('portalId') || "default";
    // const portalId = request.nextUrl.searchParams.get("portalId") || "default";
    console.log('content portalId: ', portalId)
    // Ensure the directory exists
    // await ensureDirectory(dir);
    // Read content items from JSON file
    // const contentItems = await readJsonFile(filePath);
    const contentItems = await contentManagementService.getContentManagement(
      portalId
    );

    let defaultContentItems = []
    if(portalId != 'default'){
      defaultContentItems = await contentManagementService.getContentManagement('default');
    }
    // console.log('contentItems: ', JSON.stringify(contentItems))
    // let portalexist = contentItems.findIndex((item) => item.key === portalId);
    // if (portalexist === -1) {
    //   portalexist = contentItems.findIndex((item) => item.key === "default");
    // }
    // return NextResponse.json(contentItems[portalexist]["value"], {
    //   status: 200,
    // });
    return NextResponse.json(
      {
        portalContent:contentItems,
        defaultContent:defaultContentItems
      }, 
      {
      status: 200,
    });
  } catch (error) {
    console.error("Error in GET /api/content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content items", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await logApiCall(request);
    const contentData = await request.json();
    console.log(contentData);
    if (
      !contentData.id ||
      !contentData.title ||
      !contentData.type ||
      !contentData.value ||
      !contentData.portalId
    ) {
      return NextResponse.json(
        { error: "Missing required fields: id, title, type, value" },
        { status: 400 }
      );
    }
    await ensureDirectory(dir);
    // const contentItems = await readJsonFile(filePath);
    const contentItems = await contentManagementService.getContentManagement(
      contentData.portalId
    );
    // const portalexist = contentItems.findIndex(
    //   (item) => item.key === contentData.portal
    // );
    // if (portalexist === -1) {
    //   return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    // }
    // const existingIndex = contentItems[portalexist]["value"].findIndex(
    //   (item) => item.title === contentData.title
    // );
    // if (existingIndex === -1) {
    //   return NextResponse.json(
    //     { error: "Content item not found" },
    //     { status: 404 }
    //   );
    // }

    const existingIndex = contentItems.findIndex(
      (item) => item.title === contentData.title
    );
    if (existingIndex === -1) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    // contentItems[portalexist]["value"][existingIndex] = {
    //   ...contentItems[portalexist]["value"][existingIndex],
    //   lastUpdated: formatDate(),
    //   title: contentData.title,
    //   type: contentData.type,
    //   value: contentData.value,
    // };

    // await writeJsonFile(dir, filePath, contentItems);

    // const data = { ...contentItems[portalexist]["value"][existingIndex] };
    const contentUpdated =
      await contentManagementService.updateContentManagement(contentData);
    return NextResponse.json(contentUpdated, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/content:", error);
    return NextResponse.json(
      { error: "Failed to update content item", details: error.message },
      { status: 500 }
    );
  }
}
