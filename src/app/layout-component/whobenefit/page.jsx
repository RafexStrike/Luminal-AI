"use client";

import {
  BookOpen,
  GraduationCap,
  Briefcase,
  Video,
  Microscope,
  Sparkles,
} from "lucide-react";

export default function Whobenefit() {
  const people = [
    {
      icon: <BookOpen className="w-10 h-10 text-purple-500" />,
      title: "Students",
      desc: "Turn lectures and long videos into concise notes. Revise smarter, not harder.",
    },
    {
      icon: <GraduationCap className="w-10 h-10 text-green-500" />,
      title: "Teachers",
      desc: "Prepare lessons quickly by summarizing lengthy materials into clear talking points.",
    },
    {
      icon: <Briefcase className="w-10 h-10 text-blue-500" />,
      title: "Employees",
      desc: "Skip hours of meetings—get crisp summaries of discussions and action items instantly.",
    },
    {
      icon: <Video className="w-10 h-10 text-pink-500" />,
      title: "Content Creators",
      desc: "Extract highlights from interviews, podcasts, and raw footage for faster editing.",
    },
    {
      icon: <Microscope className="w-10 h-10 text-indigo-500" />,
      title: "Researchers",
      desc: "Quickly digest academic talks and papers by focusing only on key insights.",
    },
    {
      icon: <Sparkles className="w-10 h-10 text-yellow-500" />,
      title: "Everyone Else",
      desc: "From entrepreneurs to lifelong learners—save time and unlock knowledge instantly.",
    },
  ];

  return (
    <section className="py-24  relative overflow-hidden">
     
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Heading */}
        <div className="text-center mb-16">
            
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Who <span className="bg-gradient-to-r from-blue-900 to-emerald-950 bg-clip-text text-transparent">Benefits</span> the Most?
          </h2>

          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
            Our AI platform saves time for <strong>students, teachers, employees, creators, and more</strong>.  
            Whatever you do, we make information easier to digest.
          </p>

        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {people.map((p, i) => (
            <div
              key={i}
              className=" flex flex-col justify-center items-center text-center p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200/60 dark:border-gray-800  transition-all duration-500"
            >
              {/* Icon */}
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-gray-800 dark:to-gray-700 group-hover:scale-110 transition-transform duration-300">
                {p.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                {p.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {p.desc}
              </p>

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
