"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Target, Server, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { FraudMetricCards } from "@/components/dashboard/FraudMetricCards";
import { EventTimeline } from "@/components/kafka/EventTimeline";

type FraudStats = {
  totalBlocked: number;
  totalReviewed: number;
  avgRiskScore: number;
  blockedAmount: number;
  topFlags: { flag: string; count: number }[];
  kafkaStats?: {
    blockedToday: number;
    reviewedToday: number;
    blockedAmountToday: number;
  };
};

type DonationFeed = {
  id: string;
  amount: number;
  donorId: string;
  campaignId: string;
  status: string;
  riskScore: number;
  fraudFlags: string[];
  createdAt: string;
  donor: { name: string };
};

type ActiveAnalysis = {
  score: number;
  decision: "BLOCK";
  signals: {
    velocityScore: number;
    amountScore: number;
    duplicateScore: number;
    behaviorScore: number;
    reputationScore: number;
  };
};

type ApiError = {
  response?: {
    status?: number;
    data?: {
      riskScore?: number;
      flags?: string[];
      signals?: ActiveAnalysis["signals"];
    };
  };
};

type KafkaStatsResponse = {
  consumerStatus: {
    notificationService: string;
    auditLogger: string;
    fraudAnalytics: string;
  };
};

export default function FraudDemoPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis | null>(null);
  const [campaignId, setCampaignId] = useState<string>("");
  const [simulating, setSimulating] = useState(false);

  const { data: campaigns } = useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: () => api.get<{ id: string }[]>("/api/campaigns").then((r) => r.data),
  });

  useEffect(() => {
    if (campaigns?.length && !campaignId) {
      setCampaignId(campaigns[0].id);
    }
  }, [campaigns, campaignId]);

  const { data: stats } = useQuery({
    queryKey: queryKeys.fraudStats,
    queryFn: () => api.get<FraudStats>("/api/fraud/stats").then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: feed = [] } = useQuery({
    queryKey: queryKeys.fraudFeed,
    queryFn: () => api.get<DonationFeed[]>("/api/fraud/feed").then((r) => r.data),
    refetchInterval: 5_000,
  });

  const { data: kafkaStats } = useQuery({
    queryKey: queryKeys.kafkaStats,
    queryFn: () => api.get<KafkaStatsResponse>("/api/kafka/stats").then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: auditCountToday = 0 } = useQuery({
    queryKey: queryKeys.kafkaAuditLogs(100),
    queryFn: async () => {
      const res = await api.get<{ data?: { createdAt?: string }[] }>("/api/kafka/audit-logs?limit=100");
      const items = res.data?.data || [];
      const today = new Date().toISOString().split("T")[0];
      return items.filter((item) => String(item.createdAt || "").startsWith(today)).length;
    },
    refetchInterval: 10_000,
  });

  const kafkaConsumersLabel = useMemo(() => {
    const status = kafkaStats?.consumerStatus;
    if (!status) return "3 Active";
    const n = Object.values(status).filter((s) => s === "running").length;
    return `${n} Active`;
  }, [kafkaStats?.consumerStatus]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const simulateVelocity = async () => {
    if (!campaignId) return;
    setSimulating(true);
    setLogs([]);
    setActiveAnalysis(null);

    for (let i = 1; i <= 6; i++) {
      try {
        await api.post("/api/donations/create-order", { campaignId, amount: 100 });
        addLog(`Request ${i} → ALLOW (score: 0)`);
      } catch (e: unknown) {
        const error = e as ApiError;
        if (error.response?.status === 403) {
          const riskScore = error.response.data?.riskScore ?? 0;
          const flags = error.response.data?.flags ?? [];
          const signals = error.response.data?.signals;
          if (!signals) continue;
          addLog(`Request ${i} → BLOCK (score: ${riskScore}) ${flags.join(", ")}`);
          setActiveAnalysis({ score: riskScore, decision: 'BLOCK', signals });
          break;
        } else if (error.response?.status === 429) {
          addLog(`Request ${i} → RATELIMIT (please wait)`);
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 600)); // tight loop
    }
    setSimulating(false);
  };

  const simulateSpike = async () => {
    if (!campaignId) return;
    setSimulating(true);
    setLogs([]);
    
    try {
      await api.post("/api/donations/create-order", { campaignId, amount: 9999999 });
      addLog(`Request → ALLOW`);
    } catch (e: unknown) {
      const error = e as ApiError;
      if (error.response?.status === 403) {
        const riskScore = error.response.data?.riskScore ?? 0;
        const flags = error.response.data?.flags ?? [];
        const signals = error.response.data?.signals;
        if (!signals) {
          setSimulating(false);
          return;
        }
        addLog(`Request → BLOCK (score: ${riskScore}) ${flags[0]}`);
        setActiveAnalysis({ score: riskScore, decision: 'BLOCK', signals });
      }
    }
    setSimulating(false);
  };

  const simulateBot = async () => {
    if (!campaignId) return;
    setSimulating(true);
    setLogs([]);
    
    try {
      await api.post("/api/donations/create-order", 
        { campaignId, amount: 500 },
        { headers: { 'User-Agent': 'curl/7.68.0' } }
      );
      addLog(`Request → ALLOW`);
    } catch (e: unknown) {
      const error = e as ApiError;
      if (error.response?.status === 403) {
        const riskScore = error.response.data?.riskScore ?? 0;
        const flags = error.response.data?.flags ?? [];
        const signals = error.response.data?.signals;
        if (!signals) {
          setSimulating(false);
          return;
        }
        addLog(`Request → BLOCK (score: ${riskScore}) ${flags[0]}`);
        setActiveAnalysis({ score: riskScore, decision: 'BLOCK', signals });
      }
    }
    setSimulating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="size-8 text-blue-500" /> Fraud Detection Engine
          </h1>
          <p className="mt-2 text-slate-400">Live monitoring, statistics, and interactive simulation dashboard.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
          SYSTEM LIVE
        </div>
      </div>

      {/* SECTION 0: KAFKA LIVE STREAM */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Live Event Stream</h2>
          <p className="text-sm text-slate-400">
            Real-time Kafka events flowing through PayShield
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          {[
            { label: "donation.created", color: "bg-blue-500" },
            { label: "donation.processed", color: "bg-emerald-500" },
            { label: "fraud.flagged", color: "bg-amber-500" },
            { label: "fraud.blocked", color: "bg-red-500" },
          ].map((topic) => (
            <div key={topic.label} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${topic.color}`} />
              <span>{topic.label}</span>
            </div>
          ))}
        </div>
        <EventTimeline />
      </section>

      {/* SECTION 2: STATS (shared query keys with /overview) */}
      <FraudMetricCards
        stats={stats}
        auditCountToday={auditCountToday}
        kafkaConsumersLabel={kafkaConsumersLabel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 1: LIVE FEED & CHARTS */}
        <div className="space-y-8 lg:col-span-2">
          {/* Chart */}
          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl h-80">
            <h3 className="mb-6 text-lg font-bold text-white flex items-center gap-2">
              <Activity className="size-5 text-blue-500" /> Top Fraud Flags Triggered
            </h3>
            {stats?.topFlags && stats.topFlags.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={stats.topFlags} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="flag" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={120} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.1)" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.topFlags.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#EF4444" fillOpacity={0.8 - (index * 0.15)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">Not enough data to display chart</div>
            )}
          </div>

          {/* Feed */}
          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Server className="size-5 text-emerald-500" /> Live Evaluation Feed
               </h3>
               <span className="text-xs text-slate-500">Auto-refreshing 5s...</span>
             </div>
             
             <div className="w-full overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-white/10 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Donor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {feed.slice(0, 8).map((d) => (
                        <motion.tr 
                          key={d.id}
                          initial={{ opacity: 0, y: -20, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                          animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                          transition={{ duration: 0.5 }}
                          className="hover:bg-white/5"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(d.createdAt).toLocaleTimeString()}</td>
                          <td className="px-4 py-3 font-medium">{d.donor.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">₹{d.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              d.riskScore >= 61 ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 
                              d.riskScore >= 31 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 
                              'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {d.riskScore}/100
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              d.status === 'BLOCKED' ? 'bg-red-500 text-white' : 
                              d.status === 'SUCCESS' ? 'bg-emerald-500 text-white' : 
                              'bg-amber-500 text-white'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs opacity-80">{d.fraudFlags.join(", ") || "-"}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
               </table>
               {feed.length === 0 && <div className="text-center py-10 text-slate-500">No evaluations recorded yet.</div>}
             </div>
          </div>
        </div>

        {/* SECTION 3: SIMULATOR */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl">
            <h3 className="mb-6 text-lg font-bold text-white flex items-center gap-2">
              <Target className="size-5 text-red-500" /> Interactive Simulation
            </h3>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={simulateVelocity}
                disabled={simulating}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-white">Simulate Velocity Attack</div>
                <div className="text-xs text-slate-400 mt-1">Sends 6 rapid parallel requests from your User space.</div>
              </button>
              
              <button 
                 onClick={simulateSpike}
                 disabled={simulating}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-white">Simulate Amount Spike</div>
                <div className="text-xs text-slate-400 mt-1">Submits a massive ₹99,999,999 single unverified payload.</div>
              </button>
              
              <button 
                 onClick={simulateBot}
                 disabled={simulating}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-white">Simulate Bot Emulation</div>
                <div className="text-xs text-slate-400 mt-1">Replaces User-Agent header with scripted automated curl definitions.</div>
              </button>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 h-48 overflow-y-auto font-mono text-xs">
              <div className="text-slate-500 mb-2">Network Output Logs</div>
              {logs.map((L, idx) => (
                <div key={idx} className={L.includes("BLOCK") ? "text-red-400" : L.includes("RATELIMIT") ? "text-amber-400" : "text-emerald-400"}>
                  {L}
                </div>
              ))}
            </div>

            {/* Signal Breakdown Visualizer */}
            {activeAnalysis && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 border-t border-white/10 pt-6"
              >
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Risk Analysis Engine Breakdown</h4>
                
                {[
                  { name: "Velocity Check", val: activeAnalysis.signals.velocityScore, max: 30 },
                  { name: "Amount Anomaly", val: activeAnalysis.signals.amountScore, max: 25 },
                  { name: "Duplicate Scan", val: activeAnalysis.signals.duplicateScore, max: 20 },
                  { name: "Behavioral Check", val: activeAnalysis.signals.behaviorScore, max: 15 },
                  { name: "IP Reputation", val: activeAnalysis.signals.reputationScore, max: 10 }
                ].map((sig, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{sig.name}</span>
                      <span className="font-mono">{sig.val}/{sig.max}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(sig.val / sig.max) * 100}%` }}
                        transition={{ delay: i * 0.2, duration: 0.5, ease: "easeOut" }}
                        className={`h-full ${sig.val > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-sm font-bold text-slate-300">Total Score:</span>
                  <span className="text-lg font-bold text-red-500">{activeAnalysis.score} / 100</span>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
