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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-gray-900">YouLearn</div>
        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Learn Smarter with AI</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Chat with AI tutors, generate flashcards, take quizzes, and take notes - all in one place
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Chat</h3>
            <p className="text-gray-700">
              Ask questions and get instant answers from powerful AI tutors
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎴</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Flashcards</h3>
            <p className="text-gray-700">
              Auto-generate flashcards from your chat and study efficiently
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quizzes</h3>
            <p className="text-gray-700">
              Test your knowledge with AI-generated quiz questions
            </p>
          </div>
        </div>

        {/* More Features */}
        <div className="mt-20 bg-white rounded-xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose YouLearn?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <span className="text-2xl">✨</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Personalized Learning</h4>
                <p className="text-gray-700">
                  AI adjusts to your learning pace and style
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Fast & Efficient</h4>
                <p className="text-gray-700">
                  Save hours with AI-powered summarization
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">📚</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Multiple Study Formats</h4>
                <p className="text-gray-700">
                  Chat, flashcards, quizzes, and notes in one platform
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl">🔐</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure & Private</h4>
                <p className="text-gray-700">
                  Your data is encrypted and kept private
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-600">
          <p>&copy; 2024 YouLearn. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
