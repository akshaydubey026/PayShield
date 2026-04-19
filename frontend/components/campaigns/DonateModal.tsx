"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ShieldAlert, ShieldX, Loader2, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createDonationOrder, verifyDonation } from "@/lib/campaigns";
import { RiskScoreGauge } from "../fraud/RiskScoreGauge";
import { FraudFlagBadge } from "../fraud/FraudFlagBadge";

type DonateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  onSuccess?: () => void;
};

const PRESETS = [100, 500, 1000, 2500, 5000, 10000];

type Step = "AMOUNT" | "PROCESSING" | "SUCCESS" | "FAILED" | "BLOCKED" | "RATELIMIT";

export function DonateModal({ isOpen, onClose, campaignId, campaignTitle, onSuccess }: DonateModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("AMOUNT");
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("The transaction could not be processed.");
  const [fraudData, setFraudData] = useState<{
    riskScore: number;
    flags: string[];
    signals: any;
  } | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleProceed = async () => {
    if (amount < 1) return;
    setErrorMessage("The transaction could not be processed.");
    setStep("PROCESSING");

    try {
      const order = await createDonationOrder(campaignId, amount);
      if (order.url) {
        window.location.href = order.url;
      } else {
        setStep("FAILED");
      }


    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 403) {
        setFraudData(e.response.data);
        setStep("BLOCKED");
      } else if (e.response?.status === 429) {
        const retry = e.response.data.retryAfter || 60;
        setCountdown(retry);
        setStep("RATELIMIT");
        
        let timeLeft = retry;
        const interval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          if (timeLeft <= 0) {
            clearInterval(interval);
            setStep("AMOUNT");
          }
        }, 1000);
      } else {
        setErrorMessage(
          e?.response?.data?.message ||
          e?.message ||
          "Payment failed. Please try again."
        );
        setStep("FAILED");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1E] shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "AMOUNT" && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Choose Amount</h2>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-1">{campaignTitle}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PRESETS.map((val) => (
                    <button
                      key={val}
                      onClick={() => handlePresetSelect(val)}
                      className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                        amount === val && !customAmount
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">CUSTOM AMOUNT (₹)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="Enter other amount"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleProceed}
                  disabled={amount < 1}
                  className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                >
                  Proceed to Pay ₹{amount}
                </button>
              </motion.div>
            )}

            {step === "PROCESSING" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <Loader2 className="mb-4 size-12 animate-spin text-blue-500" />
                <h2 className="text-xl font-bold text-white">Initializing Secure Checkout</h2>
                <p className="mt-2 text-sm text-slate-400">Please do not close this window.</p>
              </motion.div>
            )}

            {step === "SUCCESS" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="mb-4 size-20 text-emerald-500" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white">Thank You!</h2>
                <p className="mt-2 text-slate-400">Your donation of <strong className="text-white">₹{amount}</strong> was incredibly generous.</p>
                
                <button
                  onClick={onClose}
                  className="mt-8 w-full rounded-xl bg-white/10 py-3 font-semibold text-white hover:bg-white/20"
                >
                  Return to Campaign
                </button>
              </motion.div>
            )}

            {step === "BLOCKED" && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30"
                >
                  <ShieldX className="w-10 h-10 text-red-400" />
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-2">Transaction Blocked</h3>
                <p className="text-gray-400 text-sm mb-6">
                  PayShield's fraud detection blocked this transaction to protect you.
                </p>

                <div className="flex justify-center mb-6">
                  <RiskScoreGauge score={fraudData?.riskScore || 0} size={100} />
                </div>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {fraudData?.flags.map(flag => (
                    <FraudFlagBadge key={flag} flag={flag} />
                  ))}
                </div>

                <p className="text-xs text-gray-500">If you believe this is an error, contact support.</p>
                
                <button
                  onClick={() => { setStep('AMOUNT'); setFraudData(null); }}
                  className="mt-4 px-6 py-2 border border-white/10 rounded-xl text-gray-400 text-sm hover:text-white hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}

            {step === "RATELIMIT" && (
              <motion.div key="ratelimit" className="text-center py-8">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-500/30">
                  <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Slow Down!</h3>
                <p className="text-gray-400 text-sm mb-4">Too many attempts detected by PayShield.</p>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {countdown}s
                </div>
                <p className="text-xs text-gray-500">You can try again after the countdown</p>
              </motion.div>
            )}

            {step === "FAILED" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <X className="mb-4 size-20 text-slate-500" />
                <h2 className="text-2xl font-bold text-white">Payment Failed</h2>
                <p className="mt-2 text-sm text-slate-400">{errorMessage}</p>
                <div className="mt-6 flex w-full flex-col gap-3">
                  <button
                    onClick={() => setStep("AMOUNT")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500"
                  >
                    <ArrowLeft className="size-4" /> Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
