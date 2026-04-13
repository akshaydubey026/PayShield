"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { label: "Protected volume", value: "₹2.4Cr" },
  { label: "Fraud blocked", value: "94%" },
  { label: "Donations", value: "12,400" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
      <div className="pay-shield-hero-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="pay-shield-blob pay-shield-blob-a" aria-hidden />
      <div className="pay-shield-blob pay-shield-blob-b" aria-hidden />
      <div className="pay-shield-blob pay-shield-blob-c" aria-hidden />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
        >
          <Sparkles className="size-3.5 text-blue-400" />
          AI-powered fraud detection + secure transactions
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Donate with confidence.{" "}
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Every rupee protected.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-2xl text-lg text-slate-400"
        >
          AI-powered fraud detection and bank-grade patterns so donors and creators stay safe at
          scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/#campaigns"
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex h-11 items-center gap-1.5 bg-blue-600 px-6 text-white shadow-[0_0_40px_-8px_rgba(37,99,235,0.65)] transition-all hover:scale-[1.03] hover:bg-blue-500"
            )}
          >
            Explore Campaigns
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Link>
          <Link
            href="/#how"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 border-white/15 bg-white/[0.03] backdrop-blur-sm"
            )}
          >
            See how it works
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] hover:border-blue-500/25 hover:shadow-[0_0_32px_-12px_rgba(37,99,235,0.45)]"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              <div className="text-2xl font-semibold text-white">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
