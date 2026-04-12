// FILE: src/app/auth/login/page.jsx
// DESCRIPTION: User login page with email/password and Google OAuth options

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/secondStage";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Please enter your email and password");
      }

      // Sign in with email and password
      const { data, error: loginError } = await authClient.signIn.email({
        email,
        password,
      });

      if (loginError) {
        throw new Error(loginError.message || "Login failed");
      }

      // Redirect to secondStage or specified URL
      router.push(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
    } catch (err) {
      setError(err.message || "Google login failed");
      setGoogleLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Log in as admin with the demo admin credentials
      const { data, error: loginError } = await authClient.signIn.email({
        email: "admin@luminal.com",
        password: "admin@luminal.com",
      });

      if (loginError) {
        throw new Error(loginError.message || "Admin demo login failed");
      }

      router.push(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUserLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } = await authClient.signIn.email({
        email: "rafi@luminal.com",
        password: "rafi@luminal.com",
      });

      if (loginError) {
        throw new Error(loginError.message || "Demo login failed");
      }

      router.push(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-blue-900/40 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(30,58,138,0.15)] border border-indigo-500/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-blue-200/80">Log in to your Luminal account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            {/* Email Input */}
             <div>
               <label className="block text-sm font-medium text-blue-200/80 mb-2">
                 Email Address
               </label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com"
                 className="w-full px-4 py-3 bg-blue-950/50 border border-indigo-500/20 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                 disabled={loading}
               />
             </div>
 
             {/* Password Input */}
             <div>
               <label className="block text-sm font-medium text-blue-200/80 mb-2">
                 Password
               </label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full px-4 py-3 bg-blue-950/50 border border-indigo-500/20 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                 disabled={loading}
               />
             </div>
 
             {/* Login Button */}
             <button
               type="submit"
               disabled={loading}
               className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5"
             >

              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : "Log In"}
            </button>
          </form>

           {/* Divider */}
           <div className="flex items-center gap-4 mb-6">
             <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
             <span className="text-blue-300/50 text-sm font-medium">or continue with</span>
             <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
           </div>
 
           {/* Google Login Button */}
           <button
             onClick={handleGoogleLogin}
             disabled={googleLoading}
             className="w-full py-3 border border-indigo-500/20 bg-blue-950/30 text-white font-medium rounded-xl hover:bg-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
           >

            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Logging in..." : "Google"}
          </button>

          {/* Quick Access Section */}
           <div className="mt-8 pt-6 border-t border-indigo-500/20">
             <p className="text-center text-blue-200/60 text-xs font-semibold uppercase tracking-wider mb-4">Quick Access Demo</p>
             <div className="space-y-3">
               <button
                 onClick={handleDemoAdminLogin}
                 disabled={loading}
                 className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-indigo-500 hover:via-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.25)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-sm"
               >
                 {loading ? "Accessing..." : "Admin Access"}
               </button>
               <button
                 onClick={handleDemoUserLogin}
                 disabled={loading}
                 className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-sm"
               >
                 {loading ? "Accessing..." : "User Account"}
               </button>
             </div>
           </div>
           {/* Signup Link */}
           <div className="text-center mt-8">
             <p className="text-blue-200/60">
               Don't have an account?{" "}
               <Link href="/auth/signup" className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-colors">
                 Sign up
               </Link>
             </p>
           </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
