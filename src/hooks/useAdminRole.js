"use client";

import { useAuth } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function useAdminRole() {
  const { data: session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      // First check if role is already in session
      if (session?.user?.role === "admin") {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // If not in session, fetch from API
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/auth/user-role", {
            headers: {
              "X-User-ID": session.user.id,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.role === "admin");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    }

    checkRole();
  }, [session]);

  return { isAdmin, loading };
}
