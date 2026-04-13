"use client";

import { Shield, UserCircle, Settings, Home, ArrowRightLeft, LayoutGrid, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProfile } from "@/components/dashboard/SidebarProfile";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen overflow-hidden bg-[#050814] text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0A0F1E] lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Shield className="size-6 text-blue-500" />
          <span className="text-lg font-bold tracking-tight">PayShield</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname === '/dashboard' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Home className="size-5" />
            <span className="text-sm font-medium">Overview</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <ArrowRightLeft className="size-5" />
            <span className="text-sm font-medium">Transactions</span>
          </Link>
          <Link href="/campaigns" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname.startsWith('/campaigns') ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <LayoutGrid className="size-5" />
            <span className="text-sm font-medium">Campaigns</span>
          </Link>
          <Link href="/my-donations" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname === '/my-donations' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Heart className="size-5" />
            <span className="text-sm font-medium">My Donations</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Settings className="size-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <SidebarProfile />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0F1E] px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Shield className="size-6 text-blue-500" />
            <span className="font-bold">PayShield</span>
          </div>
          <UserCircle className="size-8 text-blue-400" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
