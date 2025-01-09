import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const excludedRoutes = {
  '/api/contentManagement': ['GET'],
  '/api/portal': ['GET'],
  '/api/auth/login': ['POST'],
  '/api/box/share': ['GET'],
  '/api/users': ['POST'],
  '/api/users/loginByProvider': ['POST'],
  '/api/setPassword': ['POST','GET']
};

const publicRoutes = [
  '/api/upload/',
  '/api/auth',
];

export function middleware(request) {
  const authToken = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
  return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const method = request.method;
    const excludedMethods = excludedRoutes[pathname];
    if (excludedMethods && excludedMethods.includes(method)) {
      return NextResponse.next();
    }
    if (!authToken) {
      console.log("Unauthorized access attempt. Token missing.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const secretKey = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET_KEY);
      const { payload } = jwtVerify(authToken, secretKey);
    } catch (error) {
      console.log('Token verification failed: ' + error.message);
      return NextResponse.json({ error: 'Unauthorized;Token verification failed' }, { status: 401 });
    }
    return NextResponse.next();
  } else {
  
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
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // "/home",
    "/login",
    "/settings",
    // "/shared-file",
    "/sharewithme",
    // "/admin/:path*",
    "/preview",
    "/api/:path*"
    // "/set-password",
    // "/:portalid/:path*", // Dynamic portal route for nested pages
  ],
};
