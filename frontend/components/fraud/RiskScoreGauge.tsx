"use client";

import { motion } from "framer-motion";

interface Props { 
  score: number; 
  size?: number; 
}

export function RiskScoreGauge({ score, size = 120 }: Props) {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 61 ? '#EF4444' :
    score >= 31 ? '#F59E0B' : '#10B981';

  const label =
    score >= 61 ? 'HIGH RISK' :
    score >= 31 ? 'MEDIUM RISK' : 'LOW RISK';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Animated score arc */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        {/* Score number */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={size * 0.2}
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span style={{ color }} className="text-xs font-bold tracking-wider">
        {label}
      </span>
    </div>
  );
}
