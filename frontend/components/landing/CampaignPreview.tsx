"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

const campaigns = [
  {
    title: "Clean water for rural schools",
    raised: 842000,
    goal: 1200000,
    daysLeft: 14,
    accent: "from-emerald-500/20 to-cyan-500/10",
  },
  {
    title: "Emergency relief — coastal communities",
    raised: 2100000,
    goal: 3500000,
    daysLeft: 9,
    accent: "from-blue-500/25 to-indigo-500/10",
  },
  {
    title: "Scholarships for first-generation learners",
    raised: 560000,
    goal: 800000,
    daysLeft: 21,
    accent: "from-violet-500/20 to-blue-500/10",
  },
];

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CampaignPreview() {
  return (
    <section id="campaigns" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Campaign preview
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
          Glass cards with lift on hover—progress, pacing, and a donate action ready for wiring.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {campaigns.map((c, i) => {
            const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
            return (
              <motion.article
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_24px_60px_-28px_rgba(37,99,235,0.35)]"
                style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
              >
                <div
                  className={`h-36 bg-gradient-to-br ${c.accent} ring-1 ring-inset ring-white/10`}
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-medium text-white">{c.title}</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{pct}% funded</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="size-3.5" />
                        {c.daysLeft} days left
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-white/10" />
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    <span className="text-slate-200">{formatInr(c.raised)}</span> raised of{" "}
                    <span className="text-slate-300">{formatInr(c.goal)}</span>
                  </p>
                  <Button className="mt-5 w-full bg-blue-600 text-white hover:bg-blue-500">
                    Donate
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
