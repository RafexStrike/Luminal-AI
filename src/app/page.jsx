'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Cpu,
  Zap,
  Layers,
  BrainCircuit,
  Lightbulb,
  Code2,
  Database,
  Users,
  CheckCircle2,
  ArrowRight,
  Search,
  Network,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Modular Components ---

const SectionWrapper = ({ children, className = "", id = "" }) => (
  <section id={id} className={`py-24 px-4 md:px-12 max-w-7xl mx-auto ${className}`}>
    {children}
  </section>
);

const Hero = () => (
  <div className="text-center mb-32 relative">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Badge className="mb-4 px-4 py-1 bg-indigo-500/20 text-indigo-400 border-indigo-500/30 rounded-full">
        All-in-one learing plaform for students
      </Badge>
      <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
        Luminal AI
      </h1>
      <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
        The smart workspace where content becomes knowledge. From learing to personalized practice sessions, it’s the all-in-one toolkit designed for the way students actually learn.
      </p>
      <div className="flex gap-6 justify-center">
        <Link href="/auth/signup">
          <Button size="lg" className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-500/20">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button size="lg" variant="outline" className="px-10 py-6 text-lg rounded-xl border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 transition-all">
            Sign In
          </Button>
        </Link>
      </div>
    </motion.div>
  </div>
);

const RagShowcase = () => (
  <SectionWrapper id="rag" className="grid md:grid-cols-2 gap-16 items-center">
    <div className="space-y-6">
      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
        <Search className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">Hallucination-Free Knowledge</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        Luminal doesn't just guess. Our proprietary RAG (Retrieval-Augmented Generation) pipeline
        embeds your textbooks and notes into a high-dimensional vector space, ensuring every answer
        is anchored in your actual source material.
      </p>
      <ul className="space-y-3">
        {['Source-cited responses', 'Zero-shot factual precision', 'Dynamic context windowing'].map((item) => (
          <li key={item} className="flex items-center text-indigo-300">
            <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-500" /> {item}
          </li>
        ))}
      </ul>
    </div>
    <div className="relative p-8 bg-gray-900 rounded-3xl border border-indigo-500/20 shadow-2xl">
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 text-gray-300 text-sm">
          "What are the core principles of BKT in Luminal?"
        </div>
        <div className="p-4 bg-indigo-900/30 rounded-xl border border-indigo-500/30 text-gray-200 text-sm relative">
          Bayesian Knowledge Tracing (BKT) in Luminal models the probability that a student has mastered a skill based on their performance history...
          <div className="mt-3 flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/30 text-indigo-400">Source: BKT_Logic.pdf:12</Badge>
            <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/30 text-indigo-400">Source: Tutoring_Engine.md:4</Badge>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-600/20 blur-3xl rounded-full"></div>
    </div>
  </SectionWrapper>
);

const SocraticTutor = () => {
  const concepts = [
    {
      title: 'BKT Logic',
      desc: 'Probabilistic tracking of skill mastery',
      icon: Activity,
      link: 'https://en.wikipedia.org/wiki/Bayesian_Knowledge_Tracing'
    },
    {
      title: 'IRT Scaling',
      desc: 'Dynamic difficulty adjustment per question',
      icon: Network,
      link: 'https://en.wikipedia.org/wiki/Item_response_theory'
    },
    {
      title: 'Socratic Method',
      desc: 'Guided discovery through scaffolded prompts',
      icon: Lightbulb,
      link: 'https://en.wikipedia.org/wiki/Socratic_method'
    },
  ];

  return (
    <SectionWrapper id="tutor" className="text-center space-y-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
          <BrainCircuit className="text-white w-6 h-6" />
        </div>
        <h2 className="text-4xl font-bold text-white">The Socratic Tutor</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          We move beyond simple Q&A. By combining Bayesian Knowledge Tracing (BKT) and Item Response Theory (IRT),
          Luminal maps your cognitive gaps in real-time, guiding you through an adaptive learning path
          that asks the right questions at the right time.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {concepts.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-start text-left p-8 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all group h-full"
          >
            <item.icon className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-400 mb-6">{item.desc}</p>

            {/* mt-auto pushes the button to the bottom of the flex container */}
            <div className="mt-auto">
              <Button
                variant="link"
                asChild
                className="text-blue-400 p-0 h-auto text-base font-semibold hover:text-blue-300 transition-colors"
              >
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  Know what is {item.title.split(' ')[0]} <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

const IncrementalSummary = () => (
  <SectionWrapper id="summaries" className="grid md:grid-cols-2 gap-16 items-center">
    <div className="relative order-2 md:order-1 p-8 bg-gray-900 rounded-3xl border border-blue-500/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500 ml-2 font-mono">incremental_summary_v1.json</span>
        </div>
        <div className="space-y-2 font-mono text-xs text-blue-300">
          <p className="opacity-50">// Block 1: Core Concepts</p>
          <p className="text-white">{"{ \"concept\": \"Quantum Entanglement\", \"summary\": \"Non-local connection...\" }"}</p>
          <p className="opacity-50">// Block 2: Mathematical Proofs</p>
          <p className="text-white">{"{ \"concept\": \"Bell's Theorem\", \"summary\": \"Proof against local hidden variables...\" }"}</p>
          <p className="animate-pulse text-indigo-400">{"{ \"concept\": \"...\", \"status\": \"merging\" }"}</p>
        </div>
      </div>
    </div>
    <div className="space-y-6 order-1 md:order-2">
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
        <Layers className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">Incremental Summarization</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        Stop rewriting your notes. Luminal's "Summarize as you go" workflow processes long study sessions
        into atomic JSON blocks that merge seamlessly, building a comprehensive knowledge graph
        without losing critical detail.
      </p>
      {/* <Button variant="link" className="text-blue-400 p-0 h-auto text-lg font-semibold">
        Explore the workflow <ArrowRight className="ml-2 w-5 h-5" />
      </Button> */}
    </div>
  </SectionWrapper>
);

const InteractiveVisualizer = () => (
  <SectionWrapper id="visualizer" className="text-center space-y-12">
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
        <Cpu className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">Socratic Learning</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        Learn by getting asked. Not just by asking. Type @interactive in the chat to active Socratic Learning.
      </p>
    </div>
    <div className="relative aspect-video max-w-5xl mx-auto bg-gray-900 rounded-3xl border border-indigo-500/30 overflow-hidden group">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full animate-ping mx-auto"></div>
          <p className="text-indigo-400 font-mono text-sm">Socratic Learning is active</p>
        </div>
      </div>
      <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono">What is f(x) = sin(x) * e^(-x)</span>
        <div className="flex gap-2">
          <div className="w-8 h-2 bg-indigo-500 rounded-full"></div>
          <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

const ActiveRecall = () => (
  <SectionWrapper id="recall" className="grid md:grid-cols-2 gap-16 items-center">
    <div className="space-y-6">
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
        <Zap className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">The Active Recall Loop</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        Reading is not learning. Luminal automates the bridge from consumption to retention.
        Our system analyzes your interaction patterns to generate optimized flashcards and
        adaptive quizzes that force retrieval, strengthening neural pathways.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
          <h4 className="text-white font-bold mb-1">AI Flashcards</h4>
          <p className="text-xs text-gray-500">Atomic extraction of key facts</p>
        </div>
        <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
          <h4 className="text-white font-bold mb-1">Dynamic Quizzes</h4>
          <p className="text-xs text-gray-500">IRT-based difficulty scaling</p>
        </div>
      </div>
    </div>
    <div className="relative grid grid-cols-2 gap-4">
      <div className="p-6 bg-indigo-600 rounded-2xl rotate-3 shadow-xl">
        <p className="text-white font-bold text-center">What is the BKT formula?</p>
      </div>
      <div className="p-6 bg-gray-800 rounded-2xl -rotate-3 border border-gray-700">
        <p className="text-gray-400 text-center italic">Flip to reveal answer...</p>
      </div>
      <div className="p-6 bg-gray-800 rounded-2xl rotate-6 border border-gray-700">
        <p className="text-gray-400 text-center italic">Next card in deck</p>
      </div>
      <div className="p-6 bg-blue-600 rounded-2xl -rotate-6 shadow-xl">
        <p className="text-white font-bold text-center">Item Response Theory basics?</p>
      </div>
    </div>
  </SectionWrapper>
);

const DevIntegration = () => (
  <SectionWrapper id="dev" className="text-center space-y-12">
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
        <Code2 className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">Incremental Summarization</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        We’ve implemented cutting-edge research in structured memory to bring you incremental summarization that actually works. Unlike standard AI that gets "confused" by long documents, our system updates your study guides in real-time, ensuring your summaries are always pinpoint accurate and perfectly organized.
      </p>
    </div>
    <div className="max-w-4xl mx-auto p-8 bg-black rounded-3xl border border-gray-800 font-mono text-sm text-indigo-300 text-left shadow-2xl">
      <div className="flex gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <p className="mb-2"><span className="text-purple-400">const</span> luminal = <span className="text-blue-400">new</span> LuminalAgent({"{"})</p>
      <p className="ml-4 mb-2">  model: <span className="text-green-400">'qwen2.5-coder'</span>,</p>
      <p className="ml-4 mb-2">  provider: <span className="text-green-400">'ollama'</span>,</p>
      <p className="ml-4 mb-2">  ragEnabled: <span className="text-orange-400">true</span></p>
      <p className="mb-2">{"});}"}</p>
      <p className="mb-4 text-gray-500">// Initialize agentic knowledge loop</p>
      <p className="text-white">await luminal.synthesizeKnowledge(<span className="text-green-400">'Quantum Physics'</span>);</p>
    </div>
  </SectionWrapper>
);

const KnowledgeHub = () => (
  <SectionWrapper id="hub" className="grid md:grid-cols-2 gap-16 items-center">
    <div className="relative order-2 md:order-1 p-8 bg-gray-900 rounded-3xl border border-indigo-500/20">
      <div className="grid grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-indigo-500/10 border border-indigo-500/30 animate-pulse"></div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="p-4 bg-indigo-600 rounded-full shadow-2xl">
          <Database className="text-white w-8 h-8" />
        </div>
      </div>
    </div>
    <div className="space-y-6 order-1 md:order-2">
      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
        <Database className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">The Knowledge Hub</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        Centralize your intellectual assets. Manage collections of embeddings,
        source documents, and synthesized summaries in a unified hub.
        Every piece of data is indexed for instant retrieval via semantic search.
      </p>
      <ul className="space-y-3">
        {['Multi-modal embedding support', 'Collection-based partitioning', 'Semantic versioning of notes'].map((item) => (
          <li key={item} className="flex items-center text-indigo-300">
            <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-500" /> {item}
          </li>
        ))}
      </ul>
    </div>
  </SectionWrapper>
);

const RealtimeCollab = () => (
  <SectionWrapper id="collab" className="text-center space-y-12">
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
        <Users className="text-white w-6 h-6" />
      </div>
      <h2 className="text-4xl font-bold text-white">Luminal is all you need</h2>
      <p className="text-gray-400 text-lg leading-relaxed">
        The smart workspace where content becomes knowledge. From deep-dive research to personalized practice sessions, it’s the all-in-one toolkit designed for the way students actually learn.
      </p>
    </div>
    <div className="relative max-w-4xl mx-auto p-12 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 rounded-3xl border border-white/10 backdrop-blur-sm">
      <div className="flex justify-center gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-12 h-12 rounded-full bg-gray-700 border-2 border-indigo-500 overflow-hidden">
            <div className="w-full h-full bg-indigo-400/20 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-black/40 rounded-2xl border border-white/10 text-left">
        <p className="text-indigo-400 font-bold text-sm mb-2">What is c-space in robotics...</p>
        <p className="text-gray-300 text-sm italic">"In robotics represents the set of all possible mechanical configurations ..."</p>
      </div>
    </div>
  </SectionWrapper>
);

const LuminalAdvantage = () => (
  <SectionWrapper id="advantage" className="space-y-12">
    <div className="text-center max-w-3xl mx-auto space-y-6">
      <h2 className="text-4xl font-bold text-white">The Luminal Advantage</h2>
      <p className="text-gray-400 text-lg">Why settle for a generic LLM when you can have a structured pedagogy?</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-4 px-6 text-gray-400 font-medium">Feature</th>
            <th className="py-4 px-6 text-gray-400 font-medium">Standard AI</th>
            <th className="py-4 px-6 text-indigo-400 font-bold">Luminal AI</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {[
            { feat: 'Factuality', std: 'Probabilistic/Hallucinations', lum: 'RAG-cited/Source-anchored' },
            { feat: 'Learning Path', std: 'Linear/Random', lum: 'BKT & IRT Adaptive' },
            { feat: 'Retention', std: 'Passive Consumption', lum: 'Active Recall Loop' },
            { feat: 'Structure', std: 'Unstructured Chat', lum: 'Incremental Knowledge Hub' },
          ].map((row, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-indigo-500/5 transition-colors">
              <td className="py-4 px-6 font-medium">{row.feat}</td>
              <td className="py-4 px-6 text-gray-500">{row.std}</td>
              <td className="py-4 px-6 text-indigo-300 font-semibold">{row.lum}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SectionWrapper>
);

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useAuth();

  if (session?.user) {
    router.push('/secondStage');
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Luminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-indigo-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Hero />
        <RagShowcase />
        <SocraticTutor />
        <IncrementalSummary />
        <InteractiveVisualizer />
        <ActiveRecall />
        <DevIntegration />
        <KnowledgeHub />
        <RealtimeCollab />
        <LuminalAdvantage />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500">
          <div className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Luminal AI
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Luminal AI. Cognitive Architecture for Mastery.</p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-indigo-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-indigo-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-indigo-400 transition-colors">API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
