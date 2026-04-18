"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type SidebarLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** When true, active if pathname starts with href (e.g. /campaigns). */
  prefixMatch?: boolean;
  /** Optional trailing badge (e.g. LIVE on Fraud Demo). */
  badge?: string;
};

export function SidebarLink({ href, icon: Icon, label, prefixMatch, badge }: SidebarLinkProps) {
  const pathname = usePathname();
  const active = prefixMatch ? pathname.startsWith(href) : pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors ${
        active ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-5 shrink-0" />
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      {badge ? (
        <span className="flex shrink-0 items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-400">
          <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
