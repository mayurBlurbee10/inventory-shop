import { logApiCall, readJsonFile } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";
import path from "path";

const dataFilePath = path.join(process.cwd(), 'data', 'users.json');

export async function GET(request) {
  try {
    await logApiCall(request);
    const users = await readJsonFile(dataFilePath)
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
