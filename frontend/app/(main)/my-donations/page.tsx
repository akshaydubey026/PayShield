"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { getMyDonations, type Donation } from "@/lib/campaigns";
import Link from "next/link";

export default function MyDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDonations()
      .then((data) => {
        setDonations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "FAILED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="size-4" />;
      case "FAILED": return <XCircle className="size-4" />;
      default: return <Clock3 className="size-4" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Heart className="size-8 text-blue-500" /> My Donations
        </h1>
        <p className="mt-2 text-slate-400">Track your contributions and fraud-prevention stats.</p>
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
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <Heart className="mb-4 size-12 text-slate-600" />
          <p className="text-lg text-slate-400">No donations yet. Support a campaign to get started!</p>
          <Link href="/campaigns" className="mt-4 text-blue-400 hover:underline">Browse Campaigns</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{d.campaign?.title ?? "Unknown Campaign"}</p>
                  <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                    {d.campaign?.category ?? "General"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">₹{d.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-500">{formatDate(d.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(d.status)}`}
                >
                  {getStatusIcon(d.status)} {d.status}
                </span>
                {d.stripeSessionId ? (
                  <span className="text-xs text-slate-500">Session: {d.stripeSessionId.slice(0, 14)}...</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
