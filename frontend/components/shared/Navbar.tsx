"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#campaigns", label: "Campaigns" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0F1E]/75 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600/15 ring-1 ring-blue-500/30">
            <Shield className="size-5 text-blue-500" aria-hidden />
          </span>
          <span>PayShield</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-slate-400 transition-colors hover:text-white",
                pathname === "/" && "hover:text-white"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-slate-400 sm:inline">
                {user.name}
              </span>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "hidden sm:inline-flex"
                )}
              >
                Home
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Log in
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-blue-600 text-white shadow-[0_0_24px_-4px_rgba(37,99,235,0.55)] transition-all hover:scale-[1.02] hover:bg-blue-500 hover:shadow-[0_0_32px_-4px_rgba(37,99,235,0.65)]"
                )}
              >
                Start Donating
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
