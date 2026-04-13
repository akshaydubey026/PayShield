"use client";

import { UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SidebarProfile() {
  const { user, ready } = useAuth();
  
  if (!ready || !user) {
    return (
      <div className="flex items-center gap-3 rounded-lg p-2 text-left w-full">
        <UserCircle className="size-10 text-slate-800" />
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-slate-700">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 text-left w-full cursor-pointer">
      <UserCircle className="size-10 text-blue-400" />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-white">{user.name}</span>
        <span className="text-xs text-slate-500 line-clamp-1">{user.email}</span>
      </div>
    </div>
  );
}
