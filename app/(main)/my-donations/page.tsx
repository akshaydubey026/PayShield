"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, CheckCircle, ShieldX } from "lucide-react";
import { getMyDonations, type Donation } from "@/lib/campaigns";
import Link from "next/link";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/auth";

export default function MyDonationsPage() {
  const { user, loading: authLoading } = useAuth();

  const { data: donations = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.myDonations(user?.id ?? ""),
    queryFn: getMyDonations,
    enabled: !authLoading && !!user?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <Heart className="size-8 text-blue-500" /> My Donations
        </h1>
        <p className="mt-2 text-slate-400">Your completed and security-reviewed contributions.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-5 h-8 w-full animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto mb-4 size-12 text-gray-600" />
          <p className="text-lg text-gray-400">No donations yet</p>
          <p className="mb-6 text-sm text-gray-500">Support a campaign to see your donations here</p>
          <Link
            href="/campaigns"
            className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((d: Donation) => (
            <div
              key={d.id}
              className="rounded-2xl border border-white/[0.08] bg-white/5 p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{d.campaign?.title ?? "Campaign"}</h3>
                  <span className="text-xs text-gray-400">{d.campaign?.category ?? "General"}</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹{d.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-gray-500">{formatDate(d.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                {d.status === "SUCCESS" ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    <CheckCircle className="size-4" />
                    Donated Successfully
                  </span>
                ) : d.status === "BLOCKED" ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-400">
                    <ShieldX className="size-4" />
                    Blocked for Security
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
