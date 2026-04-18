"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Settings as SettingsIcon, Shield, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Tab = "profile" | "security";

function rolePillClass(role: string) {
  if (role === "ADMIN") return "bg-violet-500/20 text-violet-300 border-violet-500/30";
  if (role === "CREATOR") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

export default function SettingsPage() {
  const { user, loading, setUser, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const sync = async () => {
      if (!user || user.createdAt) return;
      try {
        const { data } = await api.get<{ user: AuthUser }>("/api/auth/me");
        setUser(data.user);
      } catch {
        /* ignore */
      }
    };
    void sync();
  }, [user, setUser]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: user ? { name: user.name } : { name: "" },
  });

  const pwdForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onProfileSave = profileForm.handleSubmit(async (data) => {
    try {
      const { data: res } = await api.patch<{ user: AuthUser }>("/api/auth/profile", data);
      setUser(res.user);
      toast.success("Profile updated successfully");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? "Failed to update profile");
    }
  });

  const onPasswordSave = pwdForm.handleSubmit(async (data) => {
    try {
      await api.patch("/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      pwdForm.reset();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? "Failed to change password");
    }
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <SettingsIcon className="size-8 text-blue-500" />
          Settings
        </h1>
        <p className="mt-2 text-slate-400">Manage your profile and security.</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
            tab === "profile"
              ? "border-blue-500/50 bg-blue-600 text-white"
              : "border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <User className="size-4" />
            Profile
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("security")}
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
            tab === "security"
              ? "border-blue-500/50 bg-blue-600 text-white"
              : "border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Shield className="size-4" />
            Security
          </span>
        </button>
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl border border-white/10 bg-[#0A0F1E]/90 p-8 shadow-xl backdrop-blur-xl">
          <h2 className="mb-6 text-lg font-semibold text-white">Profile</h2>
          <form onSubmit={onProfileSave} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
              <input
                {...profileForm.register("name")}
                className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-400">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={user.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-slate-400"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-400">Role</span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${rolePillClass(user.role)}`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Member since <span className="text-slate-300">{memberSince}</span>
            </p>
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {profileForm.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save changes
            </button>
          </form>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E]/90 p-8 shadow-xl backdrop-blur-xl">
            <h2 className="mb-6 text-lg font-semibold text-white">Change password</h2>
            <form onSubmit={onPasswordSave} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Current password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...pwdForm.register("currentPassword")}
                  className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
                />
                {pwdForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {pwdForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...pwdForm.register("newPassword")}
                  className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
                />
                {pwdForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {pwdForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Confirm new password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...pwdForm.register("confirmPassword")}
                  className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
                />
                {pwdForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {pwdForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={pwdForm.formState.isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {pwdForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Update password
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E]/90 p-8 shadow-xl backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">Active sessions</h2>
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="font-medium text-white">Current session</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Device: Web browser</li>
                <li>Last active: Just now</li>
                <li>Location: India</li>
              </ul>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
