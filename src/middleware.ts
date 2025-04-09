// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("MIDDLEWARE RUNNING FOR: " + request.nextUrl.pathname);

  // Get token from cookies
  const token = request.cookies.get("auth-token")?.value;

  // Check if the request is for a protected route
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/lobby") ||
    request.nextUrl.pathname.startsWith("/room");

  // If accessing protected route and no token exists, redirect to login
  if (isProtectedRoute && !token) {
    console.log("NO TOKEN");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Define which routes this middleware applies to
export const config = {
  matcher: ["/lobby/:path*", "/room/:path*"],
};
