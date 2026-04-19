"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImmersiveLanding() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1E254A] via-[#10142A] to-[#0A0F1E] p-4 lg:p-12">
      {/* Background grain */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-20 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")` }}
      />

      {/* Main App Container */}
      <div className="relative z-10 flex h-[90vh] min-h-[700px] w-full max-w-[1400px] flex-col overflow-hidden rounded-[32px] bg-[#0A0A0A] shadow-2xl lg:flex-row lg:rounded-[48px] lg:p-3">
        
        {/* === LEFT SIDEBAR (Black) === */}
        <div className="hidden w-[320px] flex-col justify-between p-8 lg:flex xl:w-[360px] xl:p-10">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]">
              <Shield className="size-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">PayShield</span>
          </div>

          {/* Bottom Contact Info */}
          <div className="space-y-8">
            <div className="space-y-4 text-white/90">
              <h3 className="text-xl font-medium tracking-tight text-white">Get in Touch</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p className="transition-colors hover:text-white cursor-pointer">support@payshield.com</p>
                <p className="transition-colors hover:text-white cursor-pointer">(555) 123-4567</p>
                <p>12 Security Lane, FinTech Block<br />San Francisco, CA 94105</p>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4 text-white/50">
              <Link href="#" className="flex size-10 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-white/10 hover:text-white">
                <Globe className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* === RIGHT PANEL (Blue Glass/Dynamic) === */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] bg-[#4C53FF] p-6 lg:rounded-[36px] lg:p-8">
          
          {/* Advanced CSS fluid blobs for "3D" visual background effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-color-dodge">
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -right-20 top-20 h-[500px] w-[600px] rounded-[100%] bg-[#3b82f6] opacity-60 blur-[120px]" 
            />
            <motion.div 
              animate={{ rotate: -360, x: [0, -100, 0] }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 right-[20%] h-[600px] w-[500px] rounded-[100%] bg-[#818cf8] opacity-50 blur-[100px]" 
            />
            <motion.div 
              animate={{ y: [0, -50, 0], scale: [1, 1.1, 1] }} 
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-1/3 h-[400px] w-[400px] rounded-[100%] bg-[#6366f1] opacity-70 blur-[90px]" 
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] mix-blend-multiply" />


          {/* Navbar Inside Right Panel */}
          <div className="relative z-20 flex items-center justify-between">
            {/* Nav Links */}
            <div className="hidden rounded-full border border-white/10 bg-white/10 p-1.5 backdrop-blur-md md:flex">
              {["Home", "Features", "How it Works", "Pricing"].map((item) => (
                <button 
                  key={item} 
                  className={cn(
                    "rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
                    item === "Home" 
                      ? "bg-[#0A0A0A] text-white shadow-lg" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="ml-auto flex gap-3">
              <Link 
                href="/login" 
                className="rounded-full bg-[#0A0A0A] px-7 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 shadow-lg"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-7 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-white/20 sm:block"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-20 mt-16 flex h-full flex-col justify-center pb-20 lg:mt-0 lg:pl-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl space-y-6"
            >
              <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight text-white lg:text-[4.5rem]">
                Secure Your <br />
                Donations <br />
                with AI
              </h1>
              <p className="max-w-md text-lg text-white/80 leading-relaxed font-light">
                Detect, prevent, and manage fraud effortlessly on our premium protection network.
              </p>
            </motion.div>
          </div>

          {/* Floating Widget Cards (Right side) */}
          <div className="pointer-events-none absolute bottom-12 right-12 top-24 z-20 hidden w-[320px] flex-col items-end gap-6 xl:flex">
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="pointer-events-auto flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div>
                <div className="text-3xl font-semibold text-white">₹2.4Cr+</div>
                <div className="text-sm font-medium text-white/60">Protected daily via intelligent algorithms</div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-transform hover:scale-110 cursor-pointer">
                <ChevronRight className="size-5 text-white" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pointer-events-auto w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="text-sm font-semibold text-white mb-4">Trusted by Donors</div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img alt="User avatar" src="https://i.pravatar.cc/100?img=1" className="size-10 rounded-full border-2 border-[#5058FB] object-cover bg-white/10" />
                  <img alt="User avatar" src="https://i.pravatar.cc/100?img=2" className="size-10 rounded-full border-2 border-[#5058FB] object-cover bg-white/10" />
                  <img alt="User avatar" src="https://i.pravatar.cc/100?img=3" className="size-10 rounded-full border-2 border-[#5058FB] object-cover bg-white/10" />
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white">
                  <ChevronRight className="size-4" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="pointer-events-auto mt-auto w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="text-lg font-semibold text-white mb-2">Automated Fraud Detection</div>
              <p className="text-sm text-white/70 leading-relaxed max-w-[90%]">
                Generate highly detailed security models from scratch using our cutting edge AI technology. Save time and focus on philanthropy.
              </p>
              <div className="mt-4 flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:scale-110 transition-transform cursor-pointer ml-auto">
                <ChevronRight className="size-5 text-white" />
              </div>
            </motion.div>

          </div>

          {/* Swipe to get started Overlapping Pill */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute bottom-10 left-10 z-30 flex items-center gap-4 rounded-full border border-white/10 bg-[#0A0A0A] p-2 pr-8 shadow-2xl lg:-left-20"
          >
            <Link href="/register" className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform hover:scale-105 hover:bg-white/10">
              <ArrowRight className="size-6 text-white" />
            </Link>
            <span className="text-sm font-medium tracking-wide text-white/80">
              Get Started with PayShield
            </span>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
