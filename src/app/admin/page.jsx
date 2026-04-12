// FILE: src/app/admin/page.jsx
// DESCRIPTION: Admin root page - redirects to dashboard

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.replace("/admin/dashboard");
  }, [router]);

  return null;
}
