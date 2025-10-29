"use client";

import { useEffect, useRef } from "react";
import { Sparkles, BookOpen, Briefcase } from "lucide-react";

export default function Scrolling() {
  const containerRef = useRef(null);
  const imageSrc = "https://i.ibb.co.com/Dg4XF1YW/localhost-3000-8.png";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scroll = 0;
    const speed = 2; //speed 

    const loopScroll = () => {
      scroll += speed;

      
      if (scroll >= container.scrollHeight - container.clientHeight) {
        scroll = 0;
      }

      container.scrollTop = scroll;
      requestAnimationFrame(loopScroll);
    };

    const animationFrame = requestAnimationFrame(loopScroll);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <section className="relative">
     

      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
          Enjoy Our <span className="text-blue-500">Platform</span>
        </h2>
      </div>

      {/* Two-column start here */}
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left Column */}
        <div className="flex flex-col justify-center space-y-6">
          <h3 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
            Discover the Benefits
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Our platform brings everything you need in one place. Enjoy a
            seamless experience, learn, explore, and interact with our unique
            tools and features.
          </p>

          <div className="flex flex-col space-y-4">
            {/* 1 */}
            <div className="flex items-center space-x-3 bg-gray-100/10 dark:bg-gray-800/30 
              backdrop-blur-md p-4 rounded-xl shadow-lg 
              transform transition-transform duration-500 hover:scale-105">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <span className="text-gray-900 dark:text-white font-medium">
                Boost Productivity
              </span>
            </div>

            {/* 2 */}
            <div className="flex items-center space-x-3 bg-gray-100/10 dark:bg-gray-800/30 
              backdrop-blur-md p-4 rounded-xl shadow-lg 
              transform transition-transform duration-500 hover:scale-105">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span className="text-gray-900 dark:text-white font-medium">
                Learn Faster
              </span>
            </div>

            {/* 3 */}
            <div className="flex items-center space-x-3 bg-gray-100/10 dark:bg-gray-800/30 
              backdrop-blur-md p-4 rounded-xl shadow-lg 
              transform transition-transform duration-500 hover:scale-105">
              <Briefcase className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-900 dark:text-white font-medium">
                Team Collaboration
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-3xl shadow-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/5 dark:bg-gray-900/10 backdrop-blur-md">
          <div ref={containerRef} className="h-full overflow-hidden">
            <img
              src={imageSrc}
              alt="Scrolling"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
