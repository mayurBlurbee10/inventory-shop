import { existingPages } from "@/app/lib/data/existingPages";
import pageService from "@/services/pageService";
import { NextResponse } from "next/server";

export const bulkPages = async (items, errors, results, portalId, pluginId, updateVisibility=false) => {
  for (const item of items) {
    try {
      const pageExist = await pageService.checkIfPageWithTitleExist(
        portalId,
        item.title
      );
      if (pageExist) {
        if(updateVisibility){
          const result = await pageService.updatePage(pageExist.id, {
            visibility: item.sections
          })
          results.push(result);
          continue;
        }
        results.push(pageExist);
        continue;
      }
      const obj = {
        title : item.title,
        description : item.description,
        isCustomPage : item.isCustomPage,
        visibility : item.sections,
        plugin : pluginId
      }
      const page = await pageService.createPage(obj);
      if (!page) {
        throw new Error(`Page can't created with ${item}`);
      }
      results.push(page);
    } catch (error) {
      errors.push(error.message);
    }
  }
}

export async function POST(req) {
  try {
    const { portalId, pluginId } = await req.json();
    const items = existingPages;
    const results = [];
    const errors = [];

    await bulkPages(items, errors, results, portalId, pluginId, false)
   
    return NextResponse.json({
      message: "Pages Created",
      data: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error bulk creating pages:", error);
    return NextResponse.json(
      {
        error: "Failed to create pages.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. 'pageIds' must be a non-empty array." },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const page of items) {
      try {
        await pageService.deletePage(page.id);
        results.push({ page, status: "deleted" });
      } catch (error) {
        errors.push(`Failed to delete page with ID ${page.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: "Page deletion completed",
      deletedPages: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error bulk deleting pages:", error);
    return NextResponse.json(
      { error: "Failed to delete pages.", details: error.message },
      { status: 500 }
    );
  }
}
