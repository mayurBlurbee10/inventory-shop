import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const excludedRoutes = {
  "/api/contentManagement": ["GET"],
  "/api/portal": ["GET"],
  "/api/auth/login": ["POST"],
  "/api/box/share": ["GET"],
  "/api/users": ["GET", "POST"],
  "/api/users/tncAccept": ["PUT"],
  "/api/users/loginByProvider": ["POST"],
  "/api/setPassword": ["POST", "GET"],
  "/api/plugins": ["GET"],
  "/api/box/files/proxy-file": ["GET"],
  "/api/users/resendInviteLink": ["POST"],
  "/api/nda-agreements": ["GET"],
  "/api/auth/refresh-token": ["POST"],
};

const publicRoutes = [
  "/api/upload/",
  "/api/auth",
  "/register",
  "/setpassword",
  "/forgot-password",
  "/credential",
  "/sign-finished",
];

export async function middleware(request) {
  const authToken = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  console.log("Middleware running for pathname:", pathname);

  const isStaticAssetRequest =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    (pathname.includes(".") && !pathname.startsWith("/api"));

  if (isStaticAssetRequest) {
    return NextResponse.next();
  }

  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const hasTenantPrefix = pathSegments.length > 1;
  const tenantPrefix = hasTenantPrefix ? `/${pathSegments[0]}` : "";

  // Check if it's a public route (including tenant-prefixed versions of public pages)
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.startsWith("/api")) return pathname.startsWith(route);
    return (
      normalizedPath === route ||
      normalizedPath.startsWith(`${route}/`) ||
      (tenantPrefix &&
        (normalizedPath === `${tenantPrefix}${route}` ||
          normalizedPath.startsWith(`${tenantPrefix}${route}/`)))
    );
  });

  if (isPublicRoute) {
    console.log("Public route matched:", pathname);
    return NextResponse.next();
  }

  // Check if this is a sign-finished, forgot-password, setpassword, or credential route with any portal prefix
  if (
    pathname.includes("/sign-finished") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/setpassword") ||
    pathname.includes("/credential") ||
    pathname.includes("/register")
  ) {
    console.log("Portal-prefixed public route matched:", pathname);
    return NextResponse.next();
  }

  const loginPath = `${tenantPrefix}/login`;
  const dashboardPath = `${tenantPrefix}/dashboard`;
  const isLoginPath =
    normalizedPath === "/login" || normalizedPath === loginPath;
  const isRegisterPath =
    normalizedPath === "/register" ||
    (tenantPrefix && normalizedPath === `${tenantPrefix}/register`);

  console.log("Normalized path:", normalizedPath);
  console.log("Is register path:", isRegisterPath);

  // Verify token if present
  let payload = null;
  if (authToken) {
    try {
      const secretKey = new TextEncoder().encode(
        process.env.NEXT_PUBLIC_JWT_SECRET_KEY,
      );
      const { payload: decoded } = await jwtVerify(authToken, secretKey);
      payload = decoded;
    } catch (error) {
      console.log("Token verification failed: " + error.message);
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "Unauthorized;Token verification failed" },
          { status: 401 },
        );
      }
      // For non-API routes, if token is invalid, treat as not logged in
    }
  }

  if (request?.nextUrl?.pathname?.startsWith("/api")) {
    const method = request.method;
    const excludedMethods = excludedRoutes[pathname];
    if (excludedMethods && excludedMethods.includes(method)) {
      return NextResponse.next();
    }
    if (!payload) {
      console.log("Unauthorized access attempt. Token missing or invalid.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  } else {
    if (isLoginPath) {
      if (payload) {
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    } else if (isRegisterPath) {
      // Always allow access to register page, regardless of auth status
      return NextResponse.next();
    } else {
      if (!payload) {
        const refreshToken = request.cookies.get("refreshToken")?.value;

        // Prevent loop
        const isRefreshRoute =
          request.nextUrl.pathname.includes("/refresh-token");

        if (refreshToken && !isRefreshRoute) {
          return NextResponse.next();
        } else {
          return NextResponse.redirect(new URL(loginPath, request.url));
        }
      }

      // Role-based access control
      const restrictedRoutes = ["/advisor", "/admin"];
      const isRestrictedRoute = restrictedRoutes.some((route) => {
        const rootRoute = route;
        const tenantRoute = `${tenantPrefix}${route}`;
        return (
          normalizedPath === rootRoute ||
          normalizedPath.startsWith(`${rootRoute}/`) ||
          (tenantPrefix &&
            (normalizedPath === tenantRoute ||
              normalizedPath.startsWith(`${tenantRoute}/`)))
        );
      });

      if (isRestrictedRoute && payload.role === "user") {
        console.log(`User ${payload.email} denied access to ${normalizedPath}`);
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    }
    // Always allow access
    return NextResponse.next();
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // "/home",
    "/login",
    "/register",
    "/settings",
    // "/shared-file",
    "/sharewithme",
    "/admin/:path*",
    "/preview",
    "/api/:path*",
    // "/set-password",
    "/:portalid/:path*", // Dynamic portal route for nested pages
  ],
};
