"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import { FraudMetricCards } from "@/components/dashboard/FraudMetricCards";
import type { Campaign } from "@/lib/campaigns";

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

type DonationFeedRow = {
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

type KafkaStatsResponse = {
  today: { blocked: number; reviewed: number; blockedAmount: number };
  topFlags: { flag: string; label: string; count: number }[];
  consumerStatus: {
    notificationService: string;
    auditLogger: string;
    fraudAnalytics: string;
  };
};

type CampaignWithHealth = Campaign & { hasBlockedDonations?: boolean };

function countRunningConsumers(status: KafkaStatsResponse["consumerStatus"] | undefined) {
  if (!status) return null;
  return Object.values(status).filter((s) => s === "running").length;
}

export default function OverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading]);

  if (loading || user?.role !== "ADMIN") return null;

  return <OverviewContent />;
}

function OverviewContent() {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: queryKeys.fraudStats,
    queryFn: () => api.get<FraudStats>("/api/fraud/stats").then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: feed = [] } = useQuery({
    queryKey: queryKeys.fraudFeed,
    queryFn: () => api.get<DonationFeedRow[]>("/api/fraud/feed").then((r) => r.data),
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

  const { data: campaigns = [] } = useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: () => api.get<CampaignWithHealth[]>("/api/campaigns").then((r) => r.data),
  });

  const kafkaConsumersLabel = useMemo(() => {
    const n = countRunningConsumers(kafkaStats?.consumerStatus);
    if (n === null) return "3 Active";
    return `${n} Active`;
  }, [kafkaStats?.consumerStatus]);

  const recentFive = useMemo(() => feed.slice(0, 5), [feed]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
            <LayoutDashboard className="size-8 text-blue-500" />
            Admin overview
          </h1>
          <p className="mt-2 text-slate-400">Fraud signals, campaign health, and recent high-risk activity.</p>
        </div>
        {user && ["ADMIN", "CREATOR"].includes(user.role) && (
          <Link
            href="/campaigns/create"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="size-4" />
            New campaign
          </Link>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Key metrics</h2>
        <FraudMetricCards
          stats={stats}
          auditCountToday={auditCountToday}
          kafkaConsumersLabel={kafkaConsumersLabel}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Campaign health</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => {
            const pct = c.goalAmount > 0 ? Math.min(100, (c.raisedAmount / c.goalAmount) * 100) : 0;
            const donationCount = c._count?.donations ?? 0;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/campaigns/${c.id}`} className="font-semibold text-white hover:text-blue-400">
                    {c.title}
                  </Link>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                      {c.category}
                    </span>
                    {c.hasBlockedDonations ? (
                      <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                        At Risk
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Raised</span>
                    <span>
                      ₹{c.raisedAmount.toLocaleString()} / ₹{c.goalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{donationCount} successful donations</p>
                </div>
              </div>
            );
          })}
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-500">No active campaigns.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent activity</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Donor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentFive.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/campaigns/${d.campaignId}`} className="block text-slate-300 hover:text-blue-400">
                        {new Date(d.createdAt).toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/campaigns/${d.campaignId}`} className="hover:text-blue-400">
                        {d.donor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/campaigns/${d.campaignId}`} className="hover:text-blue-400">
                        ₹{d.amount.toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${d.campaignId}`} className="inline-flex">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            d.status === "BLOCKED"
                              ? "bg-red-500 text-white"
                              : d.status === "SUCCESS"
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-white"
                          }`}
                        >
                          {d.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${d.campaignId}`} className="inline-flex hover:opacity-90">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            d.riskScore >= 61
                              ? "border-red-500/20 bg-red-500/20 text-red-500"
                              : d.riskScore >= 31
                                ? "border-amber-500/20 bg-amber-500/20 text-amber-500"
                                : "border-emerald-500/20 bg-emerald-500/20 text-emerald-500"
                          }`}
                        >
                          {d.riskScore}/100
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentFive.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No evaluated donations yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
