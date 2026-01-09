// FILE: src/lib/auth-client.js
// DESCRIPTION: Better Auth client-side library for authentication

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Helper hook to get current session
export function useAuth() {
  return authClient.useSession();
}

// Helper to sign out
export async function signOut() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/auth/login";
      },
    },
  });
}
