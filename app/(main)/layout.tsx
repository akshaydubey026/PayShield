"use client";

import {
  Shield,
  UserCircle,
  Settings,
  Home,
  ArrowLeftRight,
  LayoutGrid,
  Heart,
  LayoutDashboard,
  Grid3x3,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { SidebarProfile } from "@/components/dashboard/SidebarProfile";
import { SidebarLink } from "@/components/dashboard/SidebarLink";
import { useAuth } from "@/lib/auth";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  prefixMatch?: boolean;
  badge?: string;
};

const donorLinks: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/campaigns", icon: Grid3x3, label: "Campaigns", prefixMatch: true },
  { href: "/my-donations", icon: Heart, label: "My Donations" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const creatorLinks: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/campaigns", icon: Grid3x3, label: "Campaigns", prefixMatch: true },
  { href: "/my-campaigns", icon: LayoutGrid, label: "My Campaigns" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const adminLinks: NavItem[] = [
  { href: "/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/campaigns", icon: Grid3x3, label: "Campaigns", prefixMatch: true },
  { href: "/my-donations", icon: Heart, label: "My Donations" },
  { href: "/fraud-demo", icon: Shield, label: "Fraud Demo", badge: "LIVE" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const links: NavItem[] =
    user?.role === "ADMIN" ? adminLinks : user?.role === "CREATOR" ? creatorLinks : donorLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050814] text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0A0F1E] lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Shield className="size-6 text-blue-500" />
          <span className="text-lg font-bold tracking-tight">PayShield</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {links.map((item) => (
            <SidebarLink
              key={item.href + item.label}
              href={item.href}
              icon={item.icon}
              label={item.label}
              prefixMatch={item.prefixMatch}
              badge={item.badge}
            />
          ))}
          <div className="mx-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">System Status</p>
            <div className="space-y-1.5">
              {[
                { label: "API Server", status: "online" },
                { label: "Redis", status: "online" },
                { label: "Kafka", status: "online" },
                { label: "PostgreSQL", status: "online" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-400">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <SidebarProfile />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0F1E] px-4 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="size-6 text-blue-500" />
            <span className="font-bold">PayShield</span>
          </Link>
          <UserCircle className="size-8 text-blue-400" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
