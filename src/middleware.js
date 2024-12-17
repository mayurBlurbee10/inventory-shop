import { NextResponse } from 'next/server';

export function middleware(request) {
  // Always allow access
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/settings/:path*']
};