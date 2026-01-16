// FILE: src/lib/SECONDARY_authPlaceholder.js
// DESCRIPTION: Auth module for stage-2 feature using Better Auth

import { getUserFromRequest } from "@/lib/auth";

/**
 * Get authenticated user from request headers
 * Uses Better Auth session validation
 * 
 * Returns: { id: string, email: string, name: string } on authenticated request, 
 * or anonymous user for development/testing.
 */
export async function getUserIfAuthenticated(req) {
  try {
    const user = await getUserFromRequest(req);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
    // For development/testing: use anonymous user ID
    return {
      id: 'anonymous-user',
      email: 'anonymous@test.local',
      name: 'Anonymous User',
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    // Fallback to anonymous user on error
    return {
      id: 'anonymous-user',
      email: 'anonymous@test.local',
      name: 'Anonymous User',
    };
  }
}

/**
 * ensureAuthMiddleware(req)
 * Helper to wrap route handlers that require auth.
 * Returns { user } if authenticated, else null.
 * 
 * Usage in route.js:
 *   const { user } = await ensureAuthMiddleware(req);
 *   if (!user) return new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401});
 */
export async function ensureAuthMiddleware(req) {
  const user = await getUserIfAuthenticated(req);
  return { user };
}
