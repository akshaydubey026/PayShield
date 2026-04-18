"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";

type ProgressBarProps = {
  percentage: number;
  color?: string;
  showLabel?: boolean;
};

export const ProgressBar = memo(function ProgressBar({
  percentage,
  color = "bg-blue-500",
  showLabel = false,
}: ProgressBarProps) {
  const [mounted, setMounted] = useState(false);
  const clamped = Math.min(Math.max(percentage, 0), 100);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-400">
          <span>Progress</span>
          <span>{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: mounted ? `${clamped}%` : "0%" }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
});
