"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SidebarProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex w-full items-center gap-3 rounded-lg p-2 text-left">
        <UserCircle className="size-10 shrink-0 text-slate-500" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-slate-400">Checking session…</span>
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <Link
        href="/login"
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
      >
        <UserCircle className="size-10 shrink-0 text-slate-500" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-blue-400">Sign in</span>
          <span className="text-xs text-slate-500">For donations & dashboard</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5">
      <UserCircle className="size-10 shrink-0 text-blue-400" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-white">{user.name}</span>
        <span className="truncate text-xs text-slate-500">{user.email}</span>
      </div>
    </div>
  );
}
