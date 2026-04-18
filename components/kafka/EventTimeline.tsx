"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  FileText,
  ShieldX,
} from "lucide-react";
import { api } from "@/lib/api";

interface KafkaEvent {
  id: string;
  topic: string;
  timestamp: string;
  payload: {
    amount?: number;
    userName?: string;
    campaignTitle?: string;
    riskScore?: number;
    flags?: string[];
    decision?: string;
  };
}

type AuditLogItem = {
  id: string;
  topic: string;
  payload: KafkaEvent["payload"] & { _meta?: { timestamp?: string } };
  createdAt: string;
};

const topicConfig = {
  "donation.created": {
    label: "Donation Created",
    icon: CreditCard,
    bgClass: "bg-blue-500/10 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  "donation.processed": {
    label: "Payment Verified",
    icon: CheckCircle,
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  "fraud.flagged": {
    label: "Fraud Flagged",
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  "fraud.blocked": {
    label: "Transaction Blocked",
    icon: ShieldX,
    bgClass: "bg-red-500/10 border-red-500/20",
    dotClass: "bg-red-500",
  },
  "audit.log": {
    label: "Audit Logged",
    icon: FileText,
    bgClass: "bg-white/5 border-white/10",
    dotClass: "bg-gray-500",
  },
} as const;

export function EventTimeline() {
  const [events, setEvents] = useState<KafkaEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get<{ data: AuditLogItem[] }>(
          "/api/kafka/audit-logs?limit=40"
        );
        const mapped: KafkaEvent[] = (data.data || [])
          .map((log) => ({
            id: log.id,
            topic: log.topic,
            timestamp: log.payload?._meta?.timestamp || log.createdAt,
            payload: log.payload || {},
          }))
          .reverse();
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load kafka timeline:", err);
      }
    };

    void fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const latest = useMemo(() => events.slice(-25), [events]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Live Event Stream</h3>
        <span className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          LIVE
        </span>
      </div>

      <div ref={scrollRef} className="max-h-[420px] overflow-y-auto pr-2">
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 h-full w-px bg-white/10" />
          <AnimatePresence initial={false}>
            {latest.map((event) => {
              const config =
                topicConfig[event.topic as keyof typeof topicConfig] ||
                topicConfig["audit.log"];
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative mb-4"
                >
                  <div
                    className={`absolute -left-[25px] top-6 size-3 rounded-full ${config.dotClass}`}
                  />
                  <div className={`rounded-xl border p-4 ${config.bgClass}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Icon className="size-4" />
                        {config.label}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <p>Topic: {event.topic}</p>
                      {event.payload.userName ? <p>User: {event.payload.userName}</p> : null}
                      {event.payload.campaignTitle ? (
                        <p>Campaign: {event.payload.campaignTitle}</p>
                      ) : null}
                      {typeof event.payload.amount === "number" ? (
                        <p>Amount: ₹{event.payload.amount.toLocaleString("en-IN")}</p>
                      ) : null}
                      {typeof event.payload.riskScore === "number" ? (
                        <p>Risk Score: {event.payload.riskScore}</p>
                      ) : null}
                      {event.payload.flags?.length ? (
                        <p>Flags: {event.payload.flags.join(", ")}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
