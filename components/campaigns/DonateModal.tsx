"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createDonationOrder, verifyDonation } from "@/lib/campaigns";

type DonateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  onSuccess?: () => void;
};

const PRESETS = [100, 500, 1000, 2500, 5000, 10000];

type Step = "AMOUNT" | "PROCESSING" | "SUCCESS" | "FAILED" | "BLOCKED";

export function DonateModal({ isOpen, onClose, campaignId, campaignTitle, onSuccess }: DonateModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("AMOUNT");
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");

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
    setStep("PROCESSING");

    try {
      const order = await createDonationOrder(campaignId, amount);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PayShield",
        description: `Donation to ${campaignTitle}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            const result = await verifyDonation(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (result.status === "SUCCESS") {
              setStep("SUCCESS");
              onSuccess?.();
            } else {
              setStep("BLOCKED");
            }
          } catch (err: any) {
             if (err?.response?.status === 400) {
                setStep("FAILED");
             } else {
                setStep("BLOCKED"); // Could map to fraud
             }
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => {
            setStep("AMOUNT");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function () {
        setStep("FAILED");
      });
      rzp.open();

    } catch (e) {
      console.error(e);
      setStep("FAILED");
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
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <ShieldAlert className="mb-4 size-20 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Transaction Blocked</h2>
                <p className="mt-2 text-sm text-slate-400">Blocked by PayShield Fraud Detection.</p>
                <div className="mt-6 flex w-full flex-col gap-3">
                  <button onClick={onClose} className="w-full rounded-xl border border-white/10 py-3 font-semibold text-white hover:bg-white/5">
                    Close
                  </button>
                </div>
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
                <p className="mt-2 text-sm text-slate-400">The transaction could not be processed.</p>
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
