'use client';

import { useState, useEffect } from 'react';

const PhotoGallery = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const galleryImages = [
    {
      id: 1,
      title: "Smart Assistance",
      subtitle: "AI that understands you",
      emoji: "🤖",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      color: "from-indigo-500 to-purple-600"
    },
    {
      id: 2,
      title: "Creative Power",
      subtitle: "Generate ideas, art & content",
      emoji: "🎨",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      color: "from-pink-500 to-rose-600"
    },
    {
      id: 3,
      title: "Data Insights",
      subtitle: "Smarter decisions with AI",
      emoji: "📊",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      color: "from-green-500 to-emerald-600"
    },
    {
      id: 4,
      title: "Future Tech",
      subtitle: "The next level of multitasking",
      emoji: "🚀",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  // Auto-rotate images every 4 seconds 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  const nextSlide = () => {
    setCurrentImageIndex(current => 
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setCurrentImageIndex(current => 
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  };

  return (
    <div className="">
      {/* Main Content stat here */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="max-w-4xl w-full">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-700 dark:text-gray-200 tracking-wide">
                AI Multitasking <span className='bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent'>Gallery</span>
              </h2>
              <span className="text-2xl">🚀</span>
            </div>
          </div>

          {/* Image Card */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700 lg:px-18 px-6 lg:py-12 py-8 mb-8 transform hover:scale-[1.02] transition-all duration-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* Image */}
              <div className="flex-1">
                <div className="relative">
                  <div className="w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={galleryImages[currentImageIndex].image} 
                      alt={galleryImages[currentImageIndex].title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                  {/* Emoji Badge */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center text-3xl">
                    {galleryImages[currentImageIndex].emoji}
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white rounded-full text-sm font-medium shadow-lg">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-700 to-emerald-700 bg-clip-text text-transparent mb-4">
                  {galleryImages[currentImageIndex].title}
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  {galleryImages[currentImageIndex].subtitle}
                </p>

                {/* Progress Dots */}
                <div className="flex justify-center md:justify-start gap-2 mb-6">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-gradient-to-r from-cyan-700 to-emerald-700 scale-125' 
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 justify-center md:justify-start">
                  <button
                    onClick={prevSlide}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-gray-700 dark:text-gray-200 font-medium"
                  >
                    <span className="text-xl">👈</span>
                    Previous
                  </button>
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
                  >
                    Next
                    <span className="text-xl">👉</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xl mb-20">
              🌐 Experience the future of AI • Smarter, faster & creative 🎉
            </p>
          </div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/50 dark:from-gray-900/50 to-transparent"></div>
    </div>
  );
};

export default PhotoGallery;
