'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Sparkles, MessageCircle, BookOpen, Zap, Heart, Share2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [feedback, setFeedback] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const contentRefs = useRef([]);

  const categories = [
    { id: "all", name: "All Questions", icon: Sparkles, count: 9 },
    { id: "features", name: "Features", icon: Zap, count: 4 },
    { id: "account", name: "Account", icon: MessageCircle, count: 3 },
    { id: "technical", name: "Technical", icon: BookOpen, count: 2 }
  ];

  const faqs = [
    {
      question: "What can this AI website do?",
      answer: "This platform provides multiple AI tools including video summarization, note-taking, flashcard creation, and chat-based assistance for learning and productivity.",
      category: "features",
      likes: 42,
      helpful: 95
    },
    {
      question: "How does video summarization work?",
      answer: "You can upload or link a video, and the AI will automatically generate concise summaries highlighting the key points, saving you time and effort. The system uses advanced NLP to identify key concepts and main ideas.",
      category: "features",
      likes: 38,
      helpful: 92
    },
    {
      question: "Can I create flashcards from my notes?",
      answer: "Yes, the AI can convert your notes or summarized content into interactive flashcards to help with learning and retention. You can customize the flashcard format and difficulty level.",
      category: "features",
      likes: 51,
      helpful: 98
    },
    {
      question: "Is there a chat feature to ask questions?",
      answer: "Absolutely! You can chat with the AI to ask questions, clarify concepts, or get guidance on your learning material. The chat supports follow-up questions and context-aware responses.",
      category: "features",
      likes: 29,
      helpful: 88
    },
    {
      question: "Can I export my notes and flashcards?",
      answer: "Yes, notes and flashcards can be exported in various formats (PDF, CSV, Anki) for offline study or integration with other tools. Premium users get additional export options.",
      category: "technical",
      likes: 33,
      helpful: 90
    },
    {
      question: "Do I need an account to use these features?",
      answer: "Creating an account is required to save your work, track progress, and access personalized AI features. However, you can try basic features with a guest account.",
      category: "account",
      likes: 27,
      helpful: 85
    },
    {
      question: "Is my data secure?",
      answer: "All user data is encrypted and stored securely. Privacy is a top priority, ensuring your notes, flashcards, and chats remain private. We comply with GDPR and other privacy regulations.",
      category: "technical",
      likes: 45,
      helpful: 96
    },
    {
      question: "Are there free and paid plans?",
      answer: "Yes, a free tier is available that provide full access to all features including advanced AI tools and export options. There is no paid service Now.",
      category: "account",
      likes: 31,
      helpful: 89
    },
    {
      question: "Can I integrate this AI with other apps?",
      answer: "Integration options are available for popular platforms like Notion, Google Drive, and Quizlet, allowing you to seamlessly use AI-generated content in your workflow.",
      category: "account",
      likes: 36,
      helpful: 91
    }
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "all" || faq.category === selectedCategory)
  );

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleFeedback = (index, isHelpful) => {
    setFeedback(prev => ({
      ...prev,
      [index]: isHelpful
    }));
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareFAQ = async (faq, index) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: faq.question,
          text: faq.answer,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(`${faq.question}\n\n${faq.answer}`, index);
    }
  };

  useEffect(() => {
    if (openIndex !== null && contentRefs.current[openIndex]) {
      contentRefs.current[openIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [openIndex]);

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-2xl font-bold">FAQ Center</h2>
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Get quick answers to your questions about our AI platform
        </p>
      </div>

      {/* Search with Categories */}
      <div className="mb-8 space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-cyan-700 to-emerald-700 text-white shadow-lg scale-105'
                    : ' dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 '
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
                <span className="text-xs opacity-80">({category.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-600" />
          <input
            type="text"
            placeholder="Search questions... (Try 'video' or 'account')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent outline-none transition-all duration-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-100 to-emerald-100 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-cyan-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No FAQs match your search
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Try different keywords or browse all categories
            </p>
          </div>
        )}

        {filteredFaqs.map((faq, index) => (
          <div
            key={index}
            ref={el => contentRefs.current[index] = el}
            className="group bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-transparent  dark:hover:border-gray-600 overflow-hidden"
          >
            {/* Question Header */}
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center px-6 py-5 text-left  transition-all duration-300 rounded-3xl group-hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-700 to-emerald-700 rounded-xl flex items-center justify-center text-white text-sm font-bold mt-1 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="text-left">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                    {faq.question}
                  </span>

                  
                  <div className="flex items-center gap-3 mt-2">

                    {/* <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">
                      <Heart className="w-3 h-3" />
                      {faq.likes}
                    </span> */}
                    {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                      {faq.helpful}% found helpful
                    </span> */}
                  </div>



                </div>
              </div>
              <div className="flex items-center gap-2">
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-cyan-700 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-cyan-700 transition-all duration-300" />
                )}
              </div>
            </button>

            {/* Answer Content */}
            {openIndex === index && (
              <div className="px-6 pb-6 animate-in fade-in duration-300">
                <div className="pl-12">
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
                    {faq.answer}
                  </p>
                  
                  {/* Interactive Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Was this helpful?
                      </span>
                      <button
                        onClick={() => handleFeedback(index, true)}
                        className={`p-2 rounded-xl transition-all duration-200 ${
                          feedback[index] === true
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-500 dark:bg-gray-700 dark:hover:bg-green-800'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(index, false)}
                        className={`p-2 rounded-xl transition-all duration-200 ${
                          feedback[index] === false
                            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:bg-gray-700 dark:hover:bg-red-800'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(faq.answer, index)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => shareFAQ(faq, index)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        {/*  */}
      </div>
    </section>
  );
}