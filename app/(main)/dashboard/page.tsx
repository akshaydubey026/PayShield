"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { getAllCampaigns, getDonorSummary, type Campaign } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/auth";

function impactAccent(label: string): string {
  const map: Record<string, string> = {
    Starter: "text-slate-400",
    Bronze: "text-amber-600",
    Silver: "text-sky-300",
    Gold: "text-yellow-400",
  };
  return map[label] ?? "text-slate-400";
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.donorSummary(user?.id ?? ""),
    queryFn: getDonorSummary,
    enabled: !authLoading && !!user?.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: () => getAllCampaigns(),
  });

  const featured = useMemo(() => campaigns.slice(0, 3), [campaigns]);

  const statsLoading = authLoading || (!!user && summaryLoading);
  const impactLabel = summary?.impactScore ?? "Starter";
  const impactClass = impactAccent(impactLabel);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Welcome back.</h1>
        <p className="mt-1 text-slate-400">Here&apos;s your PayShield impact and overview for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <h3 className="text-sm font-medium text-slate-400">Total Donated</h3>
          <div className="mt-3 flex min-h-[2.5rem] items-center">
            {statsLoading ? (
              <Loader2 className="size-8 animate-spin text-slate-500" />
            ) : (
              <p className="text-4xl font-semibold tracking-tight text-white">
                ₹{(summary?.totalDonated ?? 0).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <h3 className="text-sm font-medium text-slate-400">Campaigns Supported</h3>
          <div className="mt-3 flex min-h-[2.5rem] items-center">
            {statsLoading ? (
              <Loader2 className="size-8 animate-spin text-slate-500" />
            ) : (
              <p className="text-4xl font-semibold tracking-tight text-emerald-400">{summary?.campaignsSupported ?? 0}</p>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-blue-500/5 p-8 shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)] backdrop-blur-md">
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-blue-500/20 blur-xl" />
          <h3 className="text-sm font-medium text-blue-200">Impact Score</h3>
          <div className="mt-3 flex min-h-[2.5rem] items-center">
            {statsLoading ? (
              <Loader2 className="size-8 animate-spin text-slate-500" />
            ) : (
              <p className={`text-4xl font-semibold tracking-tight ${impactClass}`}>{impactLabel}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Featured Campaigns</h2>
          <Link href="/campaigns" className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300">
            View All <ArrowRight className="size-4" />
          </Link>
        </div>

        {campaignsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-lg text-slate-300">No campaigns yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Run <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">npm run db:seed</code> in the backend folder, or open{" "}
              <Link href="/campaigns" className="text-blue-400 hover:text-blue-300">
                Campaigns
              </Link>{" "}
              once data exists.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featured.map((c: Campaign) => (
              <CampaignCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                goalAmount={c.goalAmount}
                raisedAmount={c.raisedAmount}
                category={c.category}
                donorCount={c._count?.donations || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
