"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";

const CATEGORIES = ["Education", "Health", "Environment", "Relief", "Elderly"] as const;

const categoryDot: Record<(typeof CATEGORIES)[number], string> = {
  Education: "bg-blue-500",
  Health: "bg-emerald-500",
  Environment: "bg-teal-500",
  Relief: "bg-amber-500",
  Elderly: "bg-purple-500",
};

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  goalAmount: z.number().min(1000, "Minimum goal is ₹1,000"),
  category: z.enum(CATEGORIES),
  imageUrl: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCampaignPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formattedGoal, setFormattedGoal] = useState("");

  useEffect(() => {
    if (!loading && user && !["ADMIN", "CREATOR"].includes(user.role)) {
      router.replace("/campaigns");
    }
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      goalAmount: 1000,
      category: "Education",
      imageUrl: "",
    },
  });

  const descLen = watch("description")?.length ?? 0;
  const goalVal = watch("goalAmount");

  useEffect(() => {
    const n = typeof goalVal === "number" && !Number.isNaN(goalVal) ? goalVal : 0;
    setFormattedGoal(
      n > 0
        ? `₹${n.toLocaleString("en-IN")}`
        : "₹0"
    );
  }, [goalVal]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        title: data.title,
        description: data.description,
        goalAmount: data.goalAmount,
        category: data.category,
        imageUrl: data.imageUrl && data.imageUrl.length > 0 ? data.imageUrl : undefined,
      };
      await api.post("/api/campaigns", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
      toast.success("Campaign created successfully!");
      router.push("/campaigns");
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(ax.response?.data?.error ?? ax.response?.data?.message ?? "Failed to create campaign");
    },
  });

  if (loading || !user || !["ADMIN", "CREATOR"].includes(user.role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in duration-500">
      <Link
        href="/campaigns"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to campaigns
      </Link>

      <div className="rounded-2xl border border-white/10 bg-[#0A0F1E]/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/20">
            <Plus className="size-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Campaign</h1>
            <p className="text-sm text-slate-400">Launch a verified cause on PayShield.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-300">
              Campaign title
            </label>
            <input
              id="title"
              {...register("title")}
              className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. Clean Water for Rajasthan"
            />
            {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={6}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Describe your campaign in detail (min. 50 characters)…"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>{errors.description?.message}</span>
              <span>{descLen} / 50+</span>
            </div>
          </div>

          <div>
            <label htmlFor="goalAmount" className="mb-2 block text-sm font-medium text-slate-300">
              Goal amount (INR)
            </label>
            <input
              id="goalAmount"
              type="number"
              min={1000}
              step={100}
              {...register("goalAmount", { valueAsNumber: true })}
              className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <p className="mt-1 text-sm text-slate-400">Formatted: {formattedGoal}</p>
            {errors.goalAmount && (
              <p className="mt-1 text-sm text-red-400">{errors.goalAmount.message}</p>
            )}
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#050814] px-4 py-3 pr-10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${categoryDot[field.value as (typeof CATEGORIES)[number]]}`}
                    />
                  </span>
                </div>
              )}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="mb-2 block text-sm font-medium text-slate-300">
              Image URL <span className="text-slate-500">(optional)</span>
            </label>
            <input
              id="imageUrl"
              {...register("imageUrl")}
              className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Leave empty for default category image"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-400">{errors.imageUrl.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Creating…
              </>
            ) : (
              "Create campaign"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
