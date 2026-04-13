"use client";

import { useEffect, useState } from "react";
import { getAllCampaigns, type Campaign } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [featured, setFeatured] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCampaigns()
      .then((data) => {
        setFeatured(data.slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Welcome back.</h1>
        <p className="mt-1 text-slate-400">Here&apos;s your PayShield impact and overview for today.</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <h3 className="text-sm font-medium text-slate-400">Total Donated</h3>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-white">₹0</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <h3 className="text-sm font-medium text-slate-400">Campaigns Supported</h3>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-emerald-400">0</p>
        </div>
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-8 shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-blue-500/20 blur-xl" />
          <h3 className="text-sm font-medium text-blue-200">Impact Score</h3>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-blue-400">Bronze</p>
        </div>
      </div>
      
      {/* Featured Campaigns */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Featured Campaigns</h2>
          <Link href="/campaigns" className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300">
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featured.map(c => (
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
