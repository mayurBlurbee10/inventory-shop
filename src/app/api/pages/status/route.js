import { logApiCall } from "@/app/lib/api-log-middleware";
 import pageService from "@/services/pageService";
 import { NextResponse } from "next/server";
 
 export async function PUT(req) {
   await logApiCall(req);
   const { isPageVisible, id } = await req.json();
 
   try {
     const page = await pageService.getPageById(id);
 
     if (!page) {
       return NextResponse.json(
         { error: `Page does not exist.` },
         { status: 404 }
       );
     }
 
     // Proceed to update the page
     const updatedPage = await pageService.updatePage(id, {
       isPageVisible: isPageVisible,
     });
 
     return NextResponse.json({
       message: `Page status updated successfully.`,
       data: updatedPage,
     });
   } catch (error) {
     console.error("Error:", error.message);
     return NextResponse.json(
       {
         error: `Failed to update page.`,
         details: error.message,
       },
       { status: 500 }
     );
   }
 }