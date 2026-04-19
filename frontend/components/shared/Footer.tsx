import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#070b14] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Shield className="size-5 text-blue-500" aria-hidden />
          <span className="font-medium text-white">PayShield</span>
        </div>
        <p className="text-sm text-slate-500">
          Secure donations with AI-assisted fraud signals. © {new Date().getFullYear()} PayShield.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
          <Link href="/register" className="hover:text-white">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
