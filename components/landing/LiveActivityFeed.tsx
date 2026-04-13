"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const firstNames = [
  "Rohit",
  "Ananya",
  "Kabir",
  "Meera",
  "Arjun",
  "Isha",
  "Vikram",
  "Sneha",
  "Dev",
  "Priya",
];
const amounts = [250, 500, 750, 1000, 1500, 2000, 3000, 5000];

type Line = { id: string; text: string };

function randomLine(): Line {
  const name = firstNames[Math.floor(Math.random() * firstNames.length)];
  const amt = amounts[Math.floor(Math.random() * amounts.length)];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: `${name} donated ₹${amt.toLocaleString("en-IN")} just now`,
  };
}

function seedLines(): Line[] {
  return Array.from({ length: 6 }, (_, i) => ({
    ...randomLine(),
    id: `seed-${i}-${Math.random().toString(36).slice(2)}`,
  }));
}

export function LiveActivityFeed() {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    setLines(seedLines());
    const id = setInterval(() => {
      setLines((prev) => {
        const next = [randomLine(), ...prev];
        return next.slice(0, 12);
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Live activity
          </h3>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl ring-1 ring-white/[0.04]">
          {lines.length === 0
            ? Array.from({ length: 6 }, (_, i) => (
                <div
                  key={`sk-${i}`}
                  className="border-b border-white/[0.05] py-2.5 last:border-0"
                >
                  <div className="h-4 w-[85%] max-w-[280px] animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))
            : lines.map((line, i) => (
                <motion.div
                  key={line.id}
                  initial={i === 0 ? { opacity: 0, x: -8 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-white/[0.05] py-2.5 text-sm text-slate-300 last:border-0"
                >
                  {line.text}
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
