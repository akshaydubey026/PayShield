import { AlertTriangle } from "lucide-react";

const flagLabels: Record<string, string> = {
  HIGH_VELOCITY_USER: 'Rapid Repeat Donations',
  EXTREME_VELOCITY_USER: 'Extreme Repeat Donations',
  SUSPICIOUS_IP_VELOCITY: 'Suspicious IP Activity',
  AMOUNT_SPIKE_EXTREME: 'Unusual Large Amount',
  AMOUNT_SPIKE_HIGH: 'High Amount Spike',
  AMOUNT_SPIKE_MODERATE: 'Moderate Amount Spike',
  DUPLICATE_CAMPAIGN_DONATION: 'Duplicate Campaign',
  REPEAT_DONATION_SAME_CAMPAIGN: 'Repeat Gift (short window)',
  BOT_LIKE_USER_AGENT: 'Bot-like Behavior',
  ROUND_AMOUNT_HIGH_VELOCITY: 'Suspicious Round Amount',
  BLACKLISTED_IP: 'Blacklisted IP Address',
  SHARED_IP_MULTI_ACCOUNT: 'Multiple Accounts Same IP',
};

export function FraudFlagBadge({ flag }: { flag: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/15 border border-red-500/30 rounded-full text-red-400 text-xs font-medium">
      <AlertTriangle className="w-3 h-3" />
      {flagLabels[flag] || flag}
    </span>
  );
}
