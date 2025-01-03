import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request, context) {
  const { filename } = await context.params;
  const filepath = path.join(process.cwd(), "public/uploads", filename);

  if (fs.existsSync(filepath)) {
    const file = fs.readFileSync(filepath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/png", // Adjust based on your file type
      },
    });
  } else {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
