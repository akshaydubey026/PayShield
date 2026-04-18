"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import type { Campaign } from "@/lib/campaigns";

type FeedRow = {
  id: string;
  amount: number;
  campaignId: string;
  status: string;
  riskScore: number;
  fraudFlags: string[];
  createdAt: string;
  donor: { name: string };
};

const STATUS_FILTERS = ["All", "SUCCESS", "PENDING", "BLOCKED", "FAILED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const RISK_FILTERS = ["All", "Low", "Medium", "High"] as const;
type RiskFilter = (typeof RISK_FILTERS)[number];

const PAGE_SIZE = 10;

function statusBadgeClass(status: string) {
  if (status === "SUCCESS") return "bg-emerald-500 text-white";
  if (status === "PENDING") return "bg-amber-500 text-white";
  if (status === "BLOCKED") return "bg-red-500 text-white";
  if (status === "FAILED") return "bg-gray-600 text-white";
  return "bg-amber-500 text-white";
}

function riskPillClass(score: number) {
  if (score >= 61) return "border-red-500/20 bg-red-500/20 text-red-500";
  if (score >= 31) return "border-amber-500/20 bg-amber-500/20 text-amber-500";
  return "border-emerald-500/20 bg-emerald-500/20 text-emerald-500";
}

function matchesRiskBand(score: number, band: RiskFilter): boolean {
  if (band === "All") return true;
  if (band === "Low") return score >= 0 && score <= 30;
  if (band === "Medium") return score >= 31 && score <= 60;
  return score >= 61;
}

const pillActive =
  "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]";
const pillIdle =
  "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10";

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading]);

  if (loading || user?.role !== "ADMIN") return null;

  return <TransactionsContent />;
}

function TransactionsContent() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: feed = [] } = useQuery({
    queryKey: queryKeys.fraudFeed,
    queryFn: () => api.get<FeedRow[]>("/api/fraud/feed").then((r) => r.data),
    refetchInterval: 5_000,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: () => api.get<Campaign[]>("/api/campaigns").then((r) => r.data),
  });

  const campaignTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of campaigns) m.set(c.id, c.title);
    return m;
  }, [campaigns]);

  const filtered = useMemo(() => {
    let rows = feed;
    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (riskFilter !== "All") {
      rows = rows.filter((r) => matchesRiskBand(r.riskScore, riskFilter));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.donor.name.toLowerCase().includes(q));
    }
    return rows;
  }, [feed, statusFilter, riskFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, riskFilter, search]);

  const toggleRow = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const clearFilters = () => {
    setStatusFilter("All");
    setRiskFilter("All");
    setSearch("");
  };

  const hasActiveFilters =
    statusFilter !== "All" || riskFilter !== "All" || search.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <ArrowLeftRight className="size-8 text-blue-500" />
          Transactions
        </h1>
        <p className="mt-2 text-slate-400">
          Fraud evaluation feed (donations with risk score above zero). Campaign titles from the campaigns list.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <div className="flex flex-wrap gap-2.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl border px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  statusFilter === s ? pillActive : pillIdle
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
          <div className="flex flex-wrap gap-2.5">
            {RISK_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRiskFilter(r)}
                className={`rounded-xl border px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  riskFilter === r ? pillActive : pillIdle
                }`}
              >
                {r === "All"
                  ? "All"
                  : r === "Low"
                    ? "Low (0–30)"
                    : r === "Medium"
                      ? "Medium (31–60)"
                      : "High (61+)"}
              </button>
            ))}
          </div>
        </div>
        <input
          type="search"
          placeholder="Search by donor name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-10 px-2 py-3" aria-hidden />
                <th className="whitespace-nowrap px-4 py-3">Time</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Donor</th>
                <th className="whitespace-nowrap px-4 py-3">Amount</th>
                <th className="px-4 py-3">Risk score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageRows.map((d) => {
                const open = expandedId === d.id;
                const flagCount = d.fraudFlags.length;
                const campaignTitle =
                  campaignTitleById.get(d.campaignId) ?? `${d.campaignId.slice(0, 8)}…`;
                return (
                  <Fragment key={d.id}>
                    <tr
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => toggleRow(d.id)}
                    >
                      <td className="px-2 py-3 text-slate-500">
                        <ChevronDown
                          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/campaigns/${d.campaignId}`}
                          className="font-medium text-blue-400 hover:text-blue-300"
                        >
                          {campaignTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{d.donor.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">₹{d.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${riskPillClass(d.riskScore)}`}
                        >
                          {d.riskScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(d.status)}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-400">
                        {flagCount === 0 ? "—" : `${flagCount} flag${flagCount === 1 ? "" : "s"} · tap row`}
                      </td>
                    </tr>
                    <tr className="hover:bg-transparent">
                      <td colSpan={8} className="border-b border-white/5 p-0">
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              key={d.id}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-white/5 bg-black/25 px-6 py-4 pl-14">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Fraud flags
                                </p>
                                {d.fraudFlags.length === 0 ? (
                                  <p className="text-sm text-slate-500">No flags recorded.</p>
                                ) : (
                                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                                    {d.fraudFlags.map((flag) => (
                                      <li key={flag}>{flag}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="space-y-4 py-14 text-center">
            <p className="text-slate-400">No transactions found</p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-400">
            <span>
              Showing {safePage * PAGE_SIZE + 1}–
              {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
