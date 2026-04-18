"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, Pencil, ExternalLink } from "lucide-react";
import { getMyCampaigns, type MyCampaignRow } from "@/lib/campaigns";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/auth";

const categoryColors: Record<string, string> = {
  Education: "bg-blue-500/20 text-blue-300",
  Health: "bg-emerald-500/20 text-emerald-300",
  Environment: "bg-teal-500/20 text-teal-300",
  Relief: "bg-amber-500/20 text-amber-300",
  Elderly: "bg-purple-500/20 text-purple-300",
};

export default function MyCampaignsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "CREATOR" && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: queryKeys.myCampaigns(user?.id ?? ""),
    queryFn: getMyCampaigns,
    enabled: !authLoading && !!user?.id && (user?.role === "CREATOR" || user?.role === "ADMIN"),
  });

  if (authLoading || !user || (user.role !== "CREATOR" && user.role !== "ADMIN")) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">My Campaigns</h1>
        <p className="mt-2 text-slate-400">Campaigns you created on PayShield.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-slate-400">
          You have not created any campaigns yet.
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((c: MyCampaignRow) => {
            const cat = categoryColors[c.category] ?? "bg-slate-500/20 text-slate-300";
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 transition-colors hover:border-white/15"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-white">{c.title}</h2>
                    <span className={`mt-2 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs ${cat}`}>
                      {c.category}
                    </span>
                    <p className="mt-3 line-clamp-3 text-sm text-slate-400">{c.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-500"
                      title="Coming soon"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      <ExternalLink className="size-4" />
                      View
                    </Link>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      ₹{c.raisedAmount.toLocaleString("en-IN")} raised of ₹{c.goalAmount.toLocaleString("en-IN")}
                    </span>
                    <span>{c.donationCount} donations</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(c.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
