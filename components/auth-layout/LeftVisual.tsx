"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function LeftVisual() {
  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#0A0F1E] p-10 lg:p-14">
      {/* (A) Gradient Energy Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/30 blur-[120px] rounded-full top-1/3 left-1/4 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/20 blur-[100px] rounded-full bottom-1/4 right-1/4" />
      </div>

      {/* Noise Texture */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      {/* (C) Top Navbar / Fraud Context */}
      <div className="absolute top-0 left-0 w-full px-10 py-8 flex justify-between items-center z-20">
        <Link href="/" className="group flex items-center gap-2.5 text-white">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600/20 ring-1 ring-blue-500/35 transition-transform duration-300 group-hover:scale-105">
            <Shield className="size-5 text-blue-400" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight">PayShield</span>
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 backdrop-blur-md">
          🔒 Fraud Detection Active
        </div>
      </div>

      {/* (D) Typography */}
      <div className="relative z-20 m-auto w-full max-w-xl space-y-10">
        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
            Secure donations.
            <span className="mt-2 block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Powered by intelligent fraud detection.
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20 hover:bg-white/10">
            <div className="text-2xl font-semibold text-white">₹2.4Cr</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Protected</div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20 hover:bg-white/10">
            <div className="text-2xl font-semibold text-emerald-400/95">94%</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Fraud blocked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
