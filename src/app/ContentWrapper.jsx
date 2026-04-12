"use client";

import { usePathname } from "next/navigation";

export default function ContentWrapper({ children }) {
  const pathname = usePathname();

  const showNavbarPaths = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/how-it-works",
  ];

  const shouldShowNavbar = showNavbarPaths.includes(pathname);

  return (
    <div className={shouldShowNavbar ? "pt-32" : ""}>
      {children}
    </div>
  );
}
