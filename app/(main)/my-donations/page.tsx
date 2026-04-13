"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="size-5 text-emerald-500" />;
      case "BLOCKED": return <ShieldAlert className="size-5 text-red-500" />;
      case "FAILED": return <XCircle className="size-5 text-slate-500" />;
      default: return <Activity className="size-5 text-amber-500" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "BLOCKED": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "FAILED": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
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
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : donations.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <Heart className="mb-4 size-12 text-slate-600" />
          <p className="text-lg text-slate-400">You haven't made any donations yet.</p>
          <Link href="/campaigns" className="mt-4 text-blue-400 hover:underline">Browse Campaigns</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E]">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {donations.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{d.campaign?.title || "Unknown Campaign"}</td>
                  <td className="px-6 py-4 font-bold text-white">₹{d.amount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(d.status)}`}>
                      {getStatusIcon(d.status)} {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
