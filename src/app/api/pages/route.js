import { logApiCall } from "@/app/lib/api-log-middleware";
import pageService from "@/services/pageService";
import pluginService from "@/services/pluginService";
import { NextResponse } from "next/server";

export async function GET(req) {
  await logApiCall(req);
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("pageId");
  const pageTitle = searchParams.get("page");
  const portalId = searchParams.get("portalId");

  try {
    let page;
    if (pageTitle && portalId) {
      page = await pageService.getPageByTitle(portalId, pageTitle);
    } else {
      page = await pageService.getPageById({ id: pageId });
    }
    console.log("page: ", page);
    if (!page) {
      return NextResponse.json(
        { error: `Page doesn't exist with ${pageId}` },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: `Page fetched successfully.`,
      data: page,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to get page for ${pageId}.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await logApiCall(req);
  const data = await req.json();
  console.log("data: ", data);

  if (!data.title || !data.description) {
    return NextResponse.json(
      { error: "title and description are required field" },
      { status: 400 }
    );
  }

  try {
    const pageExist = await pageService.checkIfPageWithTitleExist(
      data.portalId,
      data.title
    );
    console.log("pageExist: ", pageExist);
    if (pageExist) {
      return NextResponse.json(
        { error: `${data.title} page already exists.` },
        { status: 409 }
      );
    }
    const page = await pageService.createPage(data);
    console.log("page post: ", page);

    return NextResponse.json({
      message: `page created successfully.`,
      data: page,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to create page ${data.title}.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// export async function PUT(req) {
//   await logApiCall(req);
//   const data = await req.json();
//   console.log("data: ", data);

//   if (!data.title || !data.description) {
//     return NextResponse.json(
//       { error: "title and description are required field" },
//       { status: 400 }
//     );
//   }

//   try {
//     const pageExist = await pageService.checkIfPageWithTitleExist(data.title);
//     console.log("pageExist: ", pageExist);
//     if (!pageExist) {
//       return NextResponse.json(
//         { error: `${data.title} plugin doesn't exists.` },
//         { status: 409 }
//       );
//     }
//     const page = await pageService.updatePage(pageExist.id, data);
//     console.log("plugin post: ", page);

//     return NextResponse.json({
//       message: `page updated successfully.`,
//       data: page,
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     return NextResponse.json(
//       {
//         error: `Failed to update page for ${data.title}.`,
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

export async function PUT(req) {
  await logApiCall(req);
  const data = await req.json();
  console.log("data: ", data);

  if (!data.title || !data.description || !data.id) {
    return NextResponse.json(
      { error: "title and description are required fields" },
      { status: 400 }
    );
  }

  try {
    const page = await pageService.getPageById(data.id);
    console.log("pageExist: ", page);

    if (!page) {
      return NextResponse.json(
        { error: `Page with title "${data.title}" does not exist.` },
        { status: 404 }
      );
    }

    // Proceed to update the page
    const updatedPage = await pageService.updatePage(data.id, {
      title: data.title,
      description: data.description,
    });
    console.log("Updated page: ", updatedPage);

    return NextResponse.json({
      message: `Page "${data.title}" updated successfully.`,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to update page with title "${data.title}".`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await logApiCall(req);
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "id is a required field" },
      { status: 400 }
    );
  }

  try {
    const page = await pageService.getPageById(id);
    console.log("pageExist: ", page);

    if (!page) {
      return NextResponse.json(
        { error: `Page does not exist.` },
        { status: 404 }
      );
    }

    // Proceed to delete the page
    await pageService.deletePage(id);
    console.log(`Page deleted successfully.`);

    return NextResponse.json({
      message: `Page deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to delete page with title "${id}".`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}
