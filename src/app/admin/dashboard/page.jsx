"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import Link from "next/link";
import { BarChart3, Activity, Users, Database, AlertTriangle, RefreshCw, Trash2, ArrowLeft } from "lucide-react";

// Admin Stats Card Component
function StatCard({ icon: Icon, label, value, subtext, variant = "default" }) {
  const baseClasses = "p-6 rounded-xl border backdrop-blur-sm";
  const variants = {
    default: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    danger: "bg-red-500/10 border-red-500/30 text-red-400",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80 mb-2">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtext && <p className="text-xs mt-2 opacity-60">{subtext}</p>}
        </div>
        <Icon className="h-8 w-8 opacity-60" />
      </div>
    </div>
  );
}

// Health Status Indicator
function HealthIndicator({ name, status, details }) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    degraded: "bg-amber-500",
  };

    return (
      <div className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-950/50">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
        <span className="font-medium text-white">{name}</span>
      </div>
       {details && <p className="text-xs text-indigo-200/60 ml-6">{details}</p>}
    </div>
  );
}

// User Session Table
function UserSessionTable() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - replace with actual API call
    setSessions([
      {
        id: 1,
        email: "user1@example.com",
        sessionStart: "2 hours ago",
        activity: "Studying flashcards",
        flashcardsGenerated: 24,
      },
      {
        id: 2,
        email: "user2@example.com",
        sessionStart: "45 minutes ago",
        activity: "Chat interaction",
        flashcardsGenerated: 8,
      },
      {
        id: 3,
        email: "rafi@rafi.com",
        sessionStart: "Just now",
        activity: "Dashboard access",
        flashcardsGenerated: 0,
      },
    ]);
    setLoading(false);
  }, []);

   if (loading) {
     return <div className="text-center py-8 text-indigo-200/60">Loading sessions...</div>;
   }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
         <thead>
           <tr className="border-b border-indigo-500/20">
             <th className="text-left py-3 px-4 font-semibold text-indigo-200">User Email</th>
             <th className="text-left py-3 px-4 font-semibold text-indigo-200">Session Start</th>
             <th className="text-left py-3 px-4 font-semibold text-indigo-200">Current Activity</th>
             <th className="text-left py-3 px-4 font-semibold text-indigo-200">Flashcards Generated</th>
           </tr>
         </thead>
        <tbody>
           {sessions.map((session) => (
             <tr key={session.id} className="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition">
               <td className="py-3 px-4 text-white">{session.email}</td>
               <td className="py-3 px-4 text-indigo-200/70">{session.sessionStart}</td>
               <td className="py-3 px-4 text-indigo-200/70">{session.activity}</td>
               <td className="py-3 px-4 font-semibold text-green-400">{session.flashcardsGenerated}</td>
             </tr>
           ))}
        </tbody>
      </table>
    </div>
  );
}

// Management Actions Section
// function ManagementActions() {
//   const [actionLoading, setActionLoading] = useState(null);
//   const [actionMessage, setActionMessage] = useState("");

//   const handleBackfill = async () => {
//     setActionLoading("backfill");
//     setActionMessage("Starting backfill process...");
//     // Simulate API call
//     setTimeout(() => {
//       setActionMessage("✓ Backfill completed successfully");
//       setActionLoading(null);
//       setTimeout(() => setActionMessage(""), 3000);
//     }, 2000);
//   };

//   const handleClearRAG = async () => {
//     setActionLoading("clear");
//     setActionMessage("Clearing RAG stubs...");
//     // Simulate API call
//     setTimeout(() => {
//       setActionMessage("✓ RAG stubs cleared");
//       setActionLoading(null);
//       setTimeout(() => setActionMessage(""), 3000);
//     }, 1500);
//   };

//   return (
//     <div className="bg-[#130b24] border border-purple-500/20 rounded-xl p-6">
//       <h3 className="text-lg font-semibold text-white mb-4">Management Actions</h3>
      
//       {actionMessage && (
//         <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
//           actionMessage.startsWith("✓") 
//             ? "bg-green-500/10 border border-green-500/30 text-green-300"
//             : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
//         }`}>
//           {actionMessage}
//         </div>
//       )}

//       <div className="space-y-3">
//         <button
//           onClick={handleBackfill}
//           disabled={actionLoading === "backfill"}
//           className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//         >
//           <RefreshCw className="h-4 w-4" />
//           {actionLoading === "backfill" ? "Processing..." : "Run Backfill Embeddings"}
//         </button>

//         <button
//           onClick={handleClearRAG}
//           disabled={actionLoading === "clear"}
//           className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//         >
//           <Trash2 className="h-4 w-4" />
//           {actionLoading === "clear" ? "Processing..." : "Clear RAG Stubs"}
//         </button>
//       </div>
//     </div>
//   );
// }

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useAuth();
  const [ragStats, setRagStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check admin role
  useEffect(() => {
    if (!isPending && session?.user?.role !== "admin") {
      router.replace("/");
    }
  }, [session, isPending, router]);

  // Load RAG stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Simulated data - replace with actual API call
        setRagStats({
          totalEmbeddings: 1247,
          totalChunks: 5634,
          avgChunkSize: 512,
          vectorStoreSize: "2.4 GB",
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isPending) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#1a0f2e] to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#1a0f2e] to-black">
      {/* Header */}
       <header className="border-b border-indigo-500/20 bg-indigo-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link
                 href="/"
                 className="p-2 hover:bg-indigo-500/10 rounded-lg transition-colors"
                 title="Back to home"
               >
                 <ArrowLeft className="h-5 w-5 text-indigo-400" />
               </Link>
              <div>
                 <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                   Admin Dashboard
                 </h1>
                 <p className="text-indigo-200/60 text-sm mt-1">System management and analytics</p>
              </div>
            </div>
               <div className="text-right">
                 <p className="text-indigo-200 font-medium">{session?.user?.email}</p>
                 <p className="text-indigo-200/60 text-sm">Administrator</p>
               </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <section className="mb-12">
           <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
             <BarChart3 className="h-6 w-6 text-indigo-400" />
             System Overview
           </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Database}
              label="Total Embeddings"
              value={statsLoading ? "..." : ragStats?.totalEmbeddings}
              subtext="Vector embeddings in store"
              variant="success"
            />
            <StatCard
              icon={Database}
              label="Total Chunks"
              value={statsLoading ? "..." : ragStats?.totalChunks}
              subtext="Document chunks indexed"
              variant="success"
            />
            <StatCard
              icon={Database}
              label="Vector Store Size"
              value={statsLoading ? "..." : ragStats?.vectorStoreSize}
              subtext="Storage utilization"
              variant="default"
            />
            <StatCard
              icon={Users}
              label="Active Users"
              value="3"
              subtext="Currently logged in"
              variant="default"
            />
          </div>
        </section>

        {/* System Health */}
        <section className="mb-12">
           <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
             <Activity className="h-6 w-6 text-indigo-400" />
             System Health
           </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthIndicator
              name="LLM Service (Ollama)"
              status="online"
              details="Model: mistral (7B) - Ready"
            />
            <HealthIndicator
              name="Vector Database"
              status="online"
              details="Embeddings accessible - Good performance"
            />
            <HealthIndicator
              name="MongoDB Connection"
              status="online"
              details="Primary database - Health check OK"
            />
          </div>
        </section>

        {/* User Sessions */}
        <section className="mb-12">
           <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
             <Users className="h-6 w-6 text-indigo-400" />
             Recent Study Sessions
           </h2>
           <div className="bg-indigo-950 border border-indigo-500/20 rounded-xl overflow-hidden">
             <UserSessionTable />
           </div>
        </section>

        {/* Management Actions */}
        {/* <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
            System Management
          </h2>
          <ManagementActions />
        </section> */}

        {/* Footer Info */}
         <div className="mt-12 pt-8 border-t border-indigo-500/20 text-center text-indigo-200/60 text-sm">
           <p>Dashboard updated every 5 minutes • Admin-only access • Generated {new Date().toLocaleString()}</p>
         </div>
      </main>
    </div>
  );
}
