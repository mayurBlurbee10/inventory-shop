import { ensureDirectory, logApiCall, readJsonFile, writeJsonFile } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";
import path from "path";

const dir = path.join(process.cwd(), "data");
const filePath = path.join(dir, "users.json");

export async function GET(request) {
  try {
    await logApiCall(request);

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 }
      );
    }

    await ensureDirectory(dir);
    const users = await readJsonFile(filePath);

    const selectedUser = users.find((user) => user.resetToken === token);
    if (!selectedUser) {
      return NextResponse.json(
        { error: "Link may have expired." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Valid link." }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/setPassword:", error);
    return NextResponse.json(
      { error: "Failed to set password", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await logApiCall(request);
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await ensureDirectory(dir);
    const users = await readJsonFile(filePath);
    const userIndex = users.findIndex((item) => item?.resetToken === token);
    if (userIndex < 0) {
      return NextResponse.json(
        { error: "Link may have expired." },
        { status: 404 }
      );
    }
    users[userIndex].resetToken = null;
    users[userIndex].password = password;

    await writeJsonFile(dir, filePath, users);
    return NextResponse.json({ message: "Password Set successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error in POST /api/setPassword:", error);
    return NextResponse.json(
      { error: "Failed to set password", details: error.message },
      { status: 500 }
    );
  }
}
