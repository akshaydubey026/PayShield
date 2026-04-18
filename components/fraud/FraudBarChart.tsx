"use client";

import { Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type FlagRow = { flag: string; count: number };

type FraudBarChartProps = {
  topFlags: FlagRow[] | undefined;
};

function FraudBarChart({ topFlags }: FraudBarChartProps) {
  return (
    <div className="h-80 rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-xl">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <Activity className="size-5 text-blue-500" /> Top Fraud Flags Triggered
      </h3>
      {topFlags && topFlags.length > 0 ? (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={topFlags} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="flag"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.1)" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {topFlags.map((entry, index) => (
                <Cell key={`cell-${entry.flag}-${index}`} fill="#EF4444" fillOpacity={0.8 - index * 0.15} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-slate-500">Not enough data to display chart</div>
      )}
    </div>
  );
}

export default FraudBarChart;
