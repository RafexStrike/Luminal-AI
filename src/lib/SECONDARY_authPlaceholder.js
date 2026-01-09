// FILE: src/lib/SECONDARY_authPlaceholder.js
// DESCRIPTION: Auth module for stage-2 feature using Better Auth

import { getUserFromRequest } from "@/lib/auth";

/**
 * Get authenticated user from request headers
 * Uses Better Auth session validation
 * 
 * Returns: { id: string, email: string, name: string } on authenticated request, null on anonymous.
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
    return null;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
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
