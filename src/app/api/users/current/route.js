import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { logApiCall } from "@/app/lib/api-log-middleware";

export async function GET(request) {
  try {
    await logApiCall(request);
    // Get session token from cookies
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});

    const userEmail = cookies.userEmail;
    
    if (!userEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Read users from JSON file
    const usersPath = path.join(process.cwd(), "data", "users.json");
    const usersData = JSON.parse(fs.readFileSync(usersPath, "utf8"));

    // Find user by email
    const user = usersData.find(u => u.email === decodeURIComponent(userEmail));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data without sensitive information
    const { password, ...safeUserData } = user;
    
    return NextResponse.json({
      user: safeUserData
    });
  } catch (error) {
    console.error("Error in current user route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
