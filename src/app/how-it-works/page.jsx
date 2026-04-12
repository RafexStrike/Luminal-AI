"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { INTERACTIVE_AnimatedViz } from '@/components/interactive/INTERACTIVE_AnimatedViz';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Cpu, Database, GitBranch, Lightbulb, Zap } from 'lucide-react';

const Section = ({ children, id, className = "" }) => {
  const controls = useAnimation();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [inView, controls]);

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
      }}
      className={`py-20 border-b border-slate-800 ${className}`}
    >
      {children}
    </motion.section>
  );
};

const CodeBlock = ({ code, language = "javascript" }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
    <pre className="relative bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto font-mono text-sm text-indigo-300">
      <code>{code}</code>
    </pre>
  </div>
);

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6"
          >
            <Cpu className="w-3 h-3" />
            <span>Engineering Deep Dive</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            The <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Technical Architecture</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Exploring the cognitive engine behind Luminal: from incremental summarization to Socratic tutoring logic.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Documentation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* 1. Incremental Summarization Pipeline */}
        <Section id="summarization">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="w-6 h-6 text-indigo-400" />
                <h2 className="text-3xl font-bold text-white">Incremental Summarization</h2>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Traditional summarization is lossy and computationally expensive. Luminal uses a three-stage
                <span className="text-indigo-300"> Text → JSON → Merged JSON → Text </span>
                cycle to preserve 95%+ of semantic information while reducing LLM calls by 60-75%.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Stage 1: Structured Extraction", desc: "Converts raw prose into a machine-readable JSON schema capturing concepts, examples, and misconceptions." },
                  { title: "Stage 2: Intelligent Merging", desc: "Deduplicates and merges sequential JSON objects, preserving novelty and resolving conflicts." },
                  { title: "Stage 3: Prose Regeneration", desc: "Reconstructs the merged JSON into human-readable, flowing prose for the student." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-white font-medium">{step.title}</h4>
                      <p className="text-sm text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <INTERACTIVE_AnimatedViz
                vizType="summarization_pipeline"
                vizConfig={{
                  nodes: ["Text", "JSON", "Merged JSON", "Summary"],
                  connections: ["Text -> JSON", "JSON -> Merged JSON", "Merged JSON -> Summary"]
                }}
                className="w-full aspect-square bg-slate-900/30 rounded-2xl border border-slate-800"
              />
              <div className="absolute -bottom-4 -right-4 p-4 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl max-w-xs">
                <p className="text-xs font-mono text-indigo-400 mb-1">src/lib/generateIncrementalSummary.js</p>
                <p className="text-[10px] text-slate-500">Orchestrates the round-trip transformation to ensure lossless knowledge compression.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. Socratic Tutoring Logic */}
        <Section id="tutoring" className="bg-slate-900/20 rounded-3xl px-8 py-20">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Socratic Tutoring Logic</h2>
            </div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Using Bayesian Knowledge Tracing (BKT) and Item Response Theory (IRT),
              Luminal dynamically adapts its response strategy based on student mastery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                strategy: "Socratic Questioning",
                use: "Conceptual depth",
                desc: "Guides the student to discover the answer through strategic questioning.",
                icon: "❓"
              },
              {
                strategy: "Analogy-Based",
                use: "Abstract concepts",
                desc: "Bridges the gap between complex theory and concrete, tangible grounding.",
                icon: "💡"
              },
              {
                strategy: "Scaffolded Learning",
                use: "Multi-step processes",
                desc: "Breaks complex ideas into manageable steps, ensuring prerequisites are met.",
                icon: "🪜"
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.strategy}</h3>
                <div className="text-xs font-mono text-blue-400 mb-3 uppercase tracking-wider">{item.use}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Code className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-mono text-slate-500">Mastery Estimation Logic</span>
            </div>
            <CodeBlock code={`// Mastery = 0.4 * flashcard_perf + 0.3 * quiz_perf + 0.2 * conversation + 0.1 * temporal
const estimateMastery = (studentData) => {
  const score = calculateHeuristic(studentData);
  if (score < 0.4) return 'LOW';
  if (score < 0.8) return 'MEDIUM';
  return 'HIGH';
};

// Strategy Selection Matrix
const getStrategy = (mastery, difficulty) => {
  if (mastery === 'HIGH') return 'CHALLENGE';
  if (difficulty === 'HARD' && mastery === 'LOW') return 'PREREQUISITE_REVIEW';
  return 'SOCRATIC_SCAFFOLDING';
};`} />
          </div>
        </Section>

        {/* 3. RAG Architecture */}
        <Section id="rag">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <INTERACTIVE_AnimatedViz
                vizType="rag_flow"
                vizConfig={{
                  steps: ["PDF/Text", "Chunker", "VectorStore", "Query", "Augmented Prompt", "LLM Response"],
                  flow: "linear"
                }}
                className="w-full aspect-square bg-slate-900/30 rounded-2xl border border-slate-800"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-indigo-400" />
                <h2 className="text-3xl font-bold text-white">RAG Architecture</h2>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Retrieval-Augmented Generation (RAG) grounds the LLM in the student's own materials,
                eliminating hallucinations and providing a personalized knowledge loop.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Semantic Chunking</h4>
                    <p className="text-sm text-slate-400">Using <code className="text-indigo-300">chunker.js</code> to split content by semantic boundaries, preserving context across fragments.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Vectorized Memory</h4>
                    <p className="text-sm text-slate-400">Stored in <code className="text-blue-300">vectorStore.js</code> via HNSW (Hierarchical Navigable Small World) for O(log n) retrieval.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Contextual Augmentation</h4>
                    <p className="text-sm text-slate-400">Injecting top-K retrieved documents directly into the LLM prompt to ground the final response.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Final CTA */}
      <div className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to build the future of learning?</h2>
          <p className="text-slate-400 mb-8">Explore our open-source contributions and technical whitepapers.</p>
          <a href="https://github.com/RafexStrike/Luminal-AI" target="_blank" rel="noopener noreferrer">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-indigo-500/20">
              View GitHub Repository <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
