"use client";

import { PlayCircle, FileText, Sparkles, MessageSquare, BookOpenCheck } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6 text-center">

        
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12">
          All-in-One AI Productivity Platform
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
          Stop switching between multiple apps. Our AI brings together video summarization, note-taking, flashcards, and chatting into one powerful workspace.
        </p>


        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          
          {/* Video Summaries */}
          <div className="flex flex-col items-center">
            <PlayCircle className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              AI Video Summaries
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Quickly turn long videos into short, meaningful summaries with timestamps.
            </p>
          </div>


          {/* Notes */}
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Smart Notes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Capture ideas instantly. Our AI organizes and improves your notes automatically.
            </p>
          </div>


          {/* Flashcards */}
          <div className="flex flex-col items-center">
            <BookOpenCheck className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              AI Flashcards
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Convert notes or summaries into flashcards for fast and effective learning.
            </p>
          </div>


          {/* Chat */}
          <div className="flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-pink-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              AI Chat Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Ask questions, brainstorm, or get instant clarifications inside your workspace.
            </p>
          </div>


          {/* AI Magic */}
          <div className="flex flex-col items-center">
            <Sparkles className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              One Platform, Endless Possibilities
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Combine all your learning and productivity needs into a single AI-powered ecosystem.
            </p>
          </div>

          {/* extra for add in future */}
           <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Smart Notes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Capture ideas instantly. Our AI organizes and improves your notes automatically.
            </p>
          </div>


        </div>
      </div>
    </section>
  );
}
