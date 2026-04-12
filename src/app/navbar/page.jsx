// src/app/navbar/page.jsx
// Note: ***THIS FILE IS NOT BEING USED IN THIS PROJECT. But I did not delete it because of fear.***
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAdminRole } from "@/hooks/useAdminRole";

const routes = [
  // { href: "/", label: "Home" },
  // { href: "/chat", label: "Chat" },
  // { href: "/upload", label: "Upload" },
  // { href: "/flashcard", label: "Flashcard" },
  // { href: "/takeNotes", label: "Take Notes" },
  // { href: "/chatWithSummarization", label: "Summarization Chat" },
  { href: "/how-it-works", label: "How It's Built", landingOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useAuth();
  const { isAdmin } = useAdminRole();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left - Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">Luminal</span>AI
        </Link>

        {/* Center - Nav Links */}
         <nav className="hidden md:flex gap-6">
           {routes.map((route) => {
             if (route.landingOnly && pathname !== "/") return null;
             return (
               <Link
                 key={route.href}
                 href={route.href}
                 className={`text-sm font-medium transition-colors hover:text-primary ${
                   pathname === route.href
                     ? "text-primary"
                     : "text-muted-foreground"
                 }`}
               >
                 {route.label}
               </Link>
             );
           })}
         </nav>

        {/* Right - Search + Actions */}
        <div className="flex items-center gap-3">
    

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Admin Dashboard Button - Prominent in marked area */}
          {mounted && isAdmin && (
            <Button
              onClick={() => router.push("/admin/dashboard")}
              className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg"
            >
              <span className="text-lg mr-2">🛡️</span>
              Admin Dashboard
            </Button>
          )}

          {/* Auth Section */}
          {mounted && (
            <>
              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="overflow-hidden rounded-full"
                    >
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{session.user.name || session.user.email}</DropdownMenuItem>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-purple-400 font-semibold uppercase">Admin</div>
                        <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span>
                            <span>Admin Dashboard</span>
                          </span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={async () => {
                      const { signOut } = await import("@/lib/auth-client");
                      await signOut();
                    }}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
