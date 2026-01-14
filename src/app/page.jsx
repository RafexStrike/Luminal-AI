// FILE: src/app/page.jsx
// DESCRIPTION: Home page - redirects to login or shows landing for unauthenticated users

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useAuth();

  // Redirect authenticated users to secondStage
  if (session?.user) {
    router.push('/secondStage');
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-sm">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
          Luminal AI
        </div>
        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="px-6 py-2 text-gray-300 hover:text-white font-medium transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-32">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            All In One Learning Platform
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Experience the next generation of education technology. AI-powered tutoring, intelligent flashcard generation, adaptive quizzes, and comprehensive note-taking—unified in a single platform.
          </p>
          <div className="flex gap-6 justify-center">
            <Link
              href="/auth/signup"
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 font-semibold text-lg transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-10 py-4 border-2 border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-900/20 hover:border-purple-400 font-semibold text-lg transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Tutoring</h3>
              <p className="text-gray-400 leading-relaxed">
                Engage with advanced AI models trained to provide comprehensive, contextual answers to your questions with precision and clarity.
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Flashcards</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically generate optimized flashcards from your learning sessions using intelligent content extraction and spaced repetition algorithms.
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Adaptive Quizzes</h3>
              <p className="text-gray-400 leading-relaxed">
                Validate your knowledge with dynamically generated assessments that adapt to your proficiency level and learning progress.
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-32 relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 border border-gray-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              Enterprise-Grade Learning Platform
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-lg">Personalized Learning Pathways</h4>
                  <p className="text-gray-400 leading-relaxed">
                    Advanced algorithms analyze your learning patterns to deliver customized content that matches your pace and comprehension level.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-lg">Optimized Efficiency</h4>
                  <p className="text-gray-400 leading-relaxed">
                    Reduce study time by up to 60% with intelligent content synthesis and automated knowledge retention systems.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-lg">Unified Ecosystem</h4>
                  <p className="text-gray-400 leading-relaxed">
                    Access AI tutoring, flashcards, quizzes, and comprehensive note-taking through a seamlessly integrated interface.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-lg">Bank-Level Security</h4>
                  <p className="text-gray-400 leading-relaxed">
                    End-to-end encryption, zero-knowledge architecture, and SOC 2 Type II compliance ensure your data remains private and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-gray-800/50 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-500">
          <p>&copy; 2024 Luminal AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
