import { logApiCall } from "@/app/lib/api-log-middleware";
import pageService from "@/services/pageService";
import pluginService from "@/services/pluginService";
import { NextResponse } from "next/server";

export async function GET(req) {
  await logApiCall(req);
  const { searchParams } = new URL(req.url);
  const portalId = searchParams.get("portalId");
  const type = searchParams.get("type");

  try {
    let pluginExist;
    if (portalId && type) {
      pluginExist = await pluginService.getPluginByTypeAndPortal(
        type,
        portalId
      );
    } else if (portalId) {
      pluginExist = await pluginService.getPluginByPortalId(portalId);
    } else {
      pluginExist = await pluginService.getAllPlugins();
    }
    console.log("pluginExist: ", pluginExist);
    // if (!pluginExist) {
    //   return NextResponse.json(
    //     { error: `Plugin doesn't exists for ${portalId}.` },
    //     { status: 409 }
    //   );
    // }
    // const results = [];
    // const errors = [];
    // for (const pageId of pluginExist.pageId) {
    //   const page = await pageService.getPagesById({ id: pageId });
    //   if (!page) {
    //     errors.push(`Page doesn't exist with ${pageId}`);
    //   }
    //   results.push(page);
    // }
    // return NextResponse.json({
    //   message: `Plugin fetched successfully.`,
    //   data: { ...pluginExist, pageId: results[0] },
    //   errors: errors,
    // });
    return NextResponse.json({
      message: `Plugin fetched successfully.`,
      data: pluginExist || [],
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to get plugin for ${portalId}.`,
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

  if (!data.type) {
    return NextResponse.json(
      { error: "type and page are required fields" },
      { status: 400 }
    );
  }

  try {
    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      data.type,
      data.portalId
    );
    console.log("pluginExist: ", pluginExist);

    const matchingPlugin = pluginExist.find(
      (plugin) => plugin.type === data.type
    );

    if (matchingPlugin) {
      const pluginUpdate = await pluginService.updatePlugin(
        matchingPlugin.id,
        data
      );
      return NextResponse.json({
        message: `Plugin updated successfully.`,
        data: pluginUpdate,
      });
    }

    const plugin = await pluginService.createPlugin(data);
    console.log("plugin post: ", plugin);

    return NextResponse.json({
      message: `Plugin created successfully.`,
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to create plugin for ${data.type} in ${data.portalId}.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await logApiCall(req);
  const data = await req.json();
  console.log("data: ", data);

  if (!data.type || !data.pageId) {
    return NextResponse.json(
      { error: "type and page are required field" },
      { status: 400 }
    );
  }

  try {
    const pluginExist = await pluginService.getPluginByTypeAndPortal(
      data.type,
      data.portalId
    );
    console.log("pluginExist: ", pluginExist);
    if (!pluginExist) {
      return NextResponse.json(
        { error: `${data.type} plugin doesn't exists.` },
        { status: 409 }
      );
    }
    const plugin = await pluginService.updatePlugin(pluginExist.id, data);
    console.log("plugin post: ", plugin);

    return NextResponse.json({
      message: `plugin updated successfully.`,
      data: plugin,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to update plugin for ${data.type} in ${data.portalId}.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await logApiCall(req);
  const { id } = await req.json();

  try {
    // Check if the plugin exists by type and portalId
    const pluginExist = await pluginService.getPluginById(id);
    console.log("pluginExist: ", pluginExist);

    if (!pluginExist) {
      return NextResponse.json(
        { error: `plugin doesn't exist.` },
        { status: 409 }
      );
    }

    // const deletionPromises = pluginExist?.pages.map((page) => {
    //   if (!page.id) {
    //     console.warn(`Skipping page with invalid ID: ${JSON.stringify(page)}`);
    //     return Promise.resolve();
    //   }
    //   return pageService.deletePage(page.id).catch((error) => {
    //     console.error(
    //       `Failed to delete page with ID ${page.id}:`,
    //       error.message
    //     );
    //     throw new Error(`Failed to delete page: ${page.id}`);
    //   });
    // });

    // await Promise.all(deletionPromises);

    // Delete the plugin
    await pluginService.deletePlugin(pluginExist.id);
    console.log(`plugin deleted successfully.`);

    return NextResponse.json({
      message: `plugin deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      {
        error: `Failed to delete plugin.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}
