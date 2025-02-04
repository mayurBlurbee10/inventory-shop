import pageService from "@/services/pageService";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request data: items are required.",
        },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];
    for (const item of items) {
      try {
        const page = await pageService.createPage(item);
        if (!page) {
          throw new Error(`Page can't created with ${item}`);
        }
        results.push(page);
      } catch (error) {
        errors.push(error.message);
      }
    }
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
