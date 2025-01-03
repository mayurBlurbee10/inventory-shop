import { NextResponse } from "next/server";

export function middleware(request) {
  const authToken = request.cookies.get("token")?.value;

  const loggedInUserNotAccessPaths = request.nextUrl.pathname.includes("/login");
  if (loggedInUserNotAccessPaths) {
    if (authToken) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  } else {
    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  // Always allow access
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/home",
    "/login",
    "/settings",
    // "/shared-file",
    "/sharewithme",
    // "/admin/:path*",
    "/preview",
    // "/set-password",
    // "/:portalid/:path*", // Dynamic portal route for nested pages
  ],
};
