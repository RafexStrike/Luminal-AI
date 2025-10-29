'use client';

import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import Link from "next/link";

const AnimatedStep = ({ step, index, totalSteps }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div
      ref={ref}
      className="relative flex flex-col lg:flex-row items-center gap-8 mb-12 group"
    >

      {/* Connecting Line */}
      {index < totalSteps - 1 && (
        <div className="hidden lg:block absolute left-24 top-24 w-full h-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30 z-0">
          <div
            className="h-full bg-gradient-to-r from-blue-900 to-emerald-950 origin-left transition-transform duration-1000 delay-500"
            style={{
              transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
            }}
          />
        </div>
      )}


      {/* Step Number */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className="relative w-20 h-20 bg-gradient-to-br from-blue-900 to-emerald-950 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-500 group-hover:scale-110"
          style={{
            transform: isInView ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-180deg)',
            opacity: isInView ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: `${index * 200}ms`
          }}
        >
          <span className="text-white font-bold text-xl">
            {step.number}
          </span>
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse" />
        </div>
      </div>


      {/* Step Content */}
      <div
        className="flex-1 text-center lg:text-left"
        style={{
          transform: isInView ? 'translateX(0)' : 'translateX(-50px)',
          opacity: isInView ? 1 : 0,
          transition: 'all 0.6s ease-out',
          transitionDelay: `${index * 200 + 300}ms`
        }}
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 group-hover:shadow-xl group-hover:scale-105 transition-all duration-500">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-emerald-950 bg-clip-text text-transparent mb-3">
            {step.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const OnePlateform = () => {
  const steps = [
    {
      number: '01',
      title: 'Too Many Apps',
      description: 'Users often juggle between note-taking apps, flashcard tools, video summarizers, and chat platforms separately.',
    },
    {
      number: '02',
      title: 'Scattered Information',
      description: 'Important knowledge gets spread out across multiple apps, making it hard to stay organized and focused.',
    },
    {
      number: '03',
      title: 'Context Switching',
      description: 'Switching between different tools wastes time, reduces productivity, and creates unnecessary frustration.',
    },
    {
      number: '04',
      title: 'One Platform Solution',
      description: 'Our platform combines notes, flashcards, video summarization, and chatting into a single powerful workspace.',
    }
  ];

  const ctaRef = useRef(null);
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-50px" });

  return (
    <section className="py-10 overflow-hidden relative">
      <div className="container mx-auto px-4">
       
       
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-900 to-emerald-950 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Instead of managing different apps for every task, get everything you need in one seamless AI-powered platform.
          </p>
        </div>

       
       
        {/* Steps */}
        <div className="max-w-4xl mx-auto relative">
          {steps.map((step, index) => (
            <AnimatedStep
              key={index}
              step={step}
              index={index}
              totalSteps={steps.length}
            />
          ))}
        </div>

      
      
        {/* CTA */}
        <div
          ref={ctaRef}
          className="text-center mt-16"
          style={{
            transform: isCtaInView ? 'translateY(0)' : 'translateY(50px)',
            opacity: isCtaInView ? 1 : 0,
            transition: 'all 0.6s ease-out'
          }}
        >
         

          <p className="text-gray-500 dark:text-gray-400 mt-6 text-lg">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              All-in-One Productivity Hub
            </span>
            {' • '}
            Notes, Flashcards, Summaries & Chat in one place
          </p>
        </div>
      </div>


    </section>
  );
};

export default OnePlateform;
