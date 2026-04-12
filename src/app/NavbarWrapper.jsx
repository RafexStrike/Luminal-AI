"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar/page.jsx";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Routes where the Navbar should be displayed
  const showNavbarPaths = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/how-it-works",
  ];

  // Check if current path should display the Navbar
  const shouldShowNavbar = showNavbarPaths.includes(pathname);

  if (!shouldShowNavbar) {
    return null;
  }

  return <Navbar />;
}
