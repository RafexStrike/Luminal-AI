// FILE: src/middleware.js
// DESCRIPTION: Next.js middleware to protect secondStage and admin routes

import { NextResponse } from "next/server";

/**
 * Middleware to protect routes:
 *   - /secondStage: requires authentication
 *   - /admin: requires authentication + admin role
 * 
 * Note: Role verification happens at the page level for /admin
 *       Middleware only checks for valid session
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of protected routes
  const protectedRoutes = ["/secondStage", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    // No session found, redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, allow request to proceed
  // Note: Role verification for /admin happens at page level
  return NextResponse.next();
}

/**
 * Configuration: which paths the middleware runs on
 */
export const config = {
  matcher: [
    // Protect secondStage routes
    "/secondStage/:path*",
    // Protect admin routes
    "/admin/:path*",
  ],
};
