// FILE: src/app/api/auth/[...all]/route.js
// DESCRIPTION: Better Auth API routes handler

import { POST, GET } from "@/lib/auth";

/**
 * Catch-all route for all Better Auth endpoints:
 * - POST /api/auth/sign-in/email (email/password login)
 * - POST /api/auth/sign-up/email (email/password signup)
 * - POST /api/auth/sign-in/google (Google OAuth)
 * - POST /api/auth/sign-out (logout)
 * - GET /api/auth/session (get current session)
 * - etc.
 */

// Re-export the handlers
export { POST, GET };
