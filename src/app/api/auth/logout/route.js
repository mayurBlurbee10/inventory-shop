import { logApiCall } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";

export async function POST(req) {
  const user = req.cookies.get("user")?.value;

  await logApiCall(req, () => {}, "logout", user?.id);

  const response = NextResponse.json(
    { message: "User logout successfully" },
    { status: 200 },
  );
  response.cookies.delete("user");
  response.cookies.delete("token");
  response.cookies.delete("refreshToken");
  return response;
}
