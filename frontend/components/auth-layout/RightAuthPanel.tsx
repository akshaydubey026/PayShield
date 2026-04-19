"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

const formVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export function RightAuthPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const tab: Tab = pathname?.startsWith("/login") ? "login" : "register";

  const go = (next: Tab) => {
    router.push(next === "login" ? "/login" : "/");
  };

  return (
    <motion.div
      className="relative z-10 w-full max-w-lg"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          "w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(37,99,235,0.25)]"
        )}
      >
        <div className="mb-8 relative flex rounded-xl border border-white/[0.08] bg-black/20 p-1">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => go(t)}
              className={cn(
                "relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors duration-300 z-10",
                tab === t ? "text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab === t && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {t === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.div
              key="login"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1"
            >
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-white">Welcome back</h2>
                <p className="text-sm text-slate-400">Sign in to continue protecting every donation.</p>
              </div>
              <LoginForm showRegisterLink={false} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1"
            >
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-white">Create your account</h2>
                <p className="text-sm text-slate-400">Join donors and creators on a fraud-aware network.</p>
              </div>
              <RegisterForm showLoginLink={false} />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-xs text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
