"use client";

import Image from "next/image";
import { memo } from "react";
import { Shield, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

type CampaignCardProps = {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  donorCount: number;
  index?: number;
};

const getCategoryImage = (category: string): string => {
  const normalized = category?.trim().toLowerCase();
  const map: Record<string, string> = {
    education: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    environment: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80",
    relief: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    elderly: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80",
    water: "https://images.unsplash.com/photo-1538300342682-ffa5ba1b9186?w=800&q=80",
  };
  return map[normalized] || map["relief"];
};

const categoryBarColors: Record<string, string> = {
  Education: "bg-blue-500",
  Health: "bg-emerald-500",
  Environment: "bg-teal-500",
  Relief: "bg-amber-500",
  Elderly: "bg-purple-500",
};

const categoryColors: Record<string, string> = {
  Education: "bg-blue-500/20 text-blue-300",
  Health: "bg-emerald-500/20 text-emerald-300",
  Environment: "bg-teal-500/20 text-teal-300",
  Relief: "bg-amber-500/20 text-amber-300",
  Elderly: "bg-purple-500/20 text-purple-300",
};

export const CampaignCard = memo(function CampaignCard({
  id,
  title,
  description,
  goalAmount,
  raisedAmount,
  category,
  donorCount,
  index = 0,
}: CampaignCardProps) {
  const { user } = useAuth();
  const percentage = (raisedAmount / goalAmount) * 100;
  const image = getCategoryImage(category);
  const barColor = categoryBarColors[category] || "bg-slate-500";
  const catColor = categoryColors[category] || "bg-slate-500/20 text-slate-300";
  const hideDonate = user?.role === "CREATOR" || user?.role === "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10"
    >
      <Link
        href={`/campaigns/${id}`}
        className="flex min-h-0 flex-1 cursor-pointer flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      >
        <div className="relative h-48 shrink-0 overflow-hidden rounded-t-2xl">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-black/30 to-transparent" />

          <div className="absolute bottom-3 left-3">
            <span
              className={`rounded-full border border-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm ${catColor}`}
            >
              {category}
            </span>
          </div>

          <div className="absolute right-3 top-3">
            <div className="rounded-full border border-blue-500/30 bg-blue-500/20 p-1.5 shadow-lg backdrop-blur-sm">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 line-clamp-1 text-lg font-bold text-white transition-colors duration-200 group-hover:text-blue-400">
            {title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-400">{description}</p>

          <div className="mt-auto">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-semibold text-white">₹{raisedAmount.toLocaleString("en-IN")} raised</span>
              <span className="text-gray-500">of ₹{goalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{percentage.toFixed(0)}% funded</p>
          </div>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 p-5 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="h-4 w-4" />
          <span>{donorCount} donors</span>
        </div>
        {!hideDonate ? (
          <Link href={`/campaigns/${id}`}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors duration-200 hover:bg-blue-500"
            >
              <Heart className="h-3.5 w-3.5" />
              Donate
            </motion.span>
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
});
