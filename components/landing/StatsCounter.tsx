"use client";

import { useEffect, useRef, useState } from "react";

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useAnimatedNumber(target: number, durationMs: number, enabled: boolean, decimals = 0) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }
    startRef.current = null;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const eased = easeOutExpo(t);
      setValue(target * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs, enabled]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const c1 = useAnimatedNumber(428, 2000, visible, 0);
  const c2 = useAnimatedNumber(18.2, 2200, visible, 1);
  const c3 = useAnimatedNumber(2.1, 2100, visible, 1);
  const c4 = useAnimatedNumber(120, 1800, visible, 0);

  const displays = [
    { label: "Campaigns", text: `${c1}`, sub: "live fundraisers" },
    { label: "Total Donated", text: `₹${c2}Cr`, sub: "verified inflow" },
    { label: "Fraud Blocked", text: `₹${c3}M`, sub: "suspicious volume" },
    { label: "Detection Speed", text: `<${c4}ms`, sub: "p95 scoring latency" },
  ];

  return (
    <section id="features" className="scroll-mt-24 border-y border-white/[0.06] bg-[#080d18] px-4 py-20 sm:px-6">
      <div ref={ref} className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Platform metrics
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
          Numbers that move with easing—not linear ticks—once they enter your viewport.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displays.map((d) => (
            <div
              key={d.label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/25 hover:shadow-[0_0_40px_-16px_rgba(37,99,235,0.4)]"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              <div className="text-3xl font-semibold tracking-tight text-white">{d.text}</div>
              <div className="mt-2 text-sm font-medium text-slate-200">{d.label}</div>
              <div className="mt-1 text-xs text-slate-500">{d.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
