"use client";

import { motion } from "framer-motion";
import { CreditCard, Radar, Target } from "lucide-react";

const steps = [
  {
    title: "Choose Campaign",
    body: "Browse verified fundraisers with transparent goals and timelines.",
    icon: Target,
  },
  {
    title: "Secure Payment",
    body: "Checkout with encrypted flows and device-aware session protection.",
    icon: CreditCard,
  },
  {
    title: "Real-time Fraud Check",
    body: "Models score risk in real time before funds move—blocks abuse early.",
    icon: Radar,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
          Three calm steps from intent to impact—engineered like a payments product, not a
          brochure.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.article
              key={s.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={cardVariants}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_20px_50px_-24px_rgba(37,99,235,0.35)]"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-600/15 ring-1 ring-blue-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.5)]">
                <s.icon className="size-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
