// FILE: src/middleware.js
// DESCRIPTION: Next.js middleware to protect secondStage route and redirect unauthenticated users

import { NextResponse } from "next/server";

/**
 * Middleware to protect the /secondStage route
 * 
 * Behavior:
 *   - Check if user has valid auth session
 *   - If authenticated: allow access
 *   - If not authenticated: redirect to /auth/login
 * 
 * Routes protected:
 *   - /secondStage
 *   - /secondStage/*
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of protected routes
  const protectedRoutes = ["/secondStage"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token" || "__Secure-better-auth.session_token");

  if (!sessionCookie) {
    // No session found, redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, allow request to proceed
  return NextResponse.next();
}

/**
 * Configuration: which paths the middleware runs on
 */
export const config = {
  matcher: [
    // Protect secondStage routes
    "/secondStage/:path*",
  ],
};
