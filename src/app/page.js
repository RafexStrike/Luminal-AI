//page.js
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import FeaturesSection from "./layout-component/featuresSection/page";
import OnePlateform from "./layout-component/onePlatform/page";
import Whobenefit from "./layout-component/whobenefit/page";
import Scrolling from "./layout-component/Scrolling/page";
import PhotoGallery from "./layout-component/photoGalary/page";
import FAQ from "./layout-component/faq/page";
import SortingVisualizer from "./layout-component/sortingVisualizer/page";



export default function HomePage() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  
  useEffect(() => {
    setMounted(true);
  }, []);

  const lightBg = "https://i.ibb.co.com/SDkXYQH9/banner-light.jpg";
  const darkBg = "https://i.ibb.co.com/hJRXqpzM/bg-back.jpg";

  //default theme for server-side rendering
  const currentTheme = mounted ? theme : "light";
  const backgroundImage = currentTheme === "dark" ? darkBg : lightBg;

  return (
    <main className="min-h-screen">

      {/* Hero Section */}
      <section
        className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8 pb-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="text-black dark:text-white text-center p-4 md:p-10 max-w-4xl w-full">
          
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Your all in one AI study buddy
            </h1>
          </div>
          
          {/* Description in middle */}
          <p className="text-lg sm:text-xl md:text-2xl mb-4 md:mb-6 leading-relaxed max-w-3xl mx-auto">
            No switching apps, no losing focus.
          </p>
          
          {/* Quote */}
          <p className="italic text-base sm:text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Less time switching, more time learning.
          </p>
          

          {/* two Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-8">
            <Link
              href="/chat"
              className="w-full sm:w-auto inline-block bg-gradient-to-r from-emerald-950 to-blue-900 text-white font-semibold px-6 py-3 md:px-8 md:py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 text-center text-sm md:text-base"
            >
              GO TO CHAT
            </Link>
            <Link
              href="/upload"
              className="w-full sm:w-auto inline-block bg-gradient-to-r from-blue-900 to-emerald-950 text-white font-semibold px-6 py-3 md:px-8 md:py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 text-center text-sm md:text-base"
            >
              Summarize Video
            </Link>
          </div>
        </div>
      </section>

<FeaturesSection></FeaturesSection>

<OnePlateform></OnePlateform>

<Whobenefit></Whobenefit>

<FAQ></FAQ>


<PhotoGallery></PhotoGallery>

<Scrolling></Scrolling>

<SortingVisualizer></SortingVisualizer>

     
     
      
    </main>
  );
}
