type FraudMetricCardsProps = {
  stats: {
    totalBlocked: number;
    totalReviewed: number;
    avgRiskScore: number;
    blockedAmount: number;
  } | null | undefined;
  auditCountToday: number;
  /** Shown on the “Kafka Consumers” card; defaults to "3 Active" before data loads. */
  kafkaConsumersLabel?: string;
};

export function FraudMetricCards({
  stats,
  auditCountToday,
  kafkaConsumersLabel = "3 Active",
}: FraudMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {[
        { label: "Total Blocked Today", value: stats?.totalBlocked || 0, color: "text-red-500" },
        { label: "Pending Review", value: stats?.totalReviewed || 0, color: "text-amber-500" },
        { label: "Avg Risk Score", value: (stats?.avgRiskScore || 0).toFixed(1), color: "text-blue-500" },
        { label: "Amount Saved (INR)", value: `₹${(stats?.blockedAmount || 0).toLocaleString()}`, color: "text-emerald-500" },
        { label: "Events Today", value: auditCountToday, color: "text-violet-400" },
        {
          label: "Kafka Consumers",
          value: kafkaConsumersLabel,
          color: "text-emerald-400",
          dots: true,
        },
      ].map((s, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl">
          <p className="text-sm font-medium text-slate-400">{s.label}</p>
          <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          {s.dots ? (
            <span className="mt-2 flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
