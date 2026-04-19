"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Target, Users } from "lucide-react";
import { getCampaignById, type Campaign, type Donation, verifyDonation } from "@/lib/campaigns";
import { ProgressBar } from "@/components/campaigns/ProgressBar";
import { DonateModal } from "@/components/campaigns/DonateModal";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const getCategoryImage = (category: string): string => {
  const normalized = category?.trim().toLowerCase();
  const map: Record<string, string> = {
    'education': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
    'health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
    'environment': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80',
    'relief': 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80',
    'elderly': 'https://images.unsplash.com/photo-1447005497901-b3e9ee359928?w=1200&q=80',
    'water': 'https://images.unsplash.com/photo-1538300342682-ffa5ba1b9186?w=1200&q=80'
  };
  return map[normalized] || map['relief'];
};

export default function CampaignDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { ready } = useAuth();
  const [campaign, setCampaign] = useState<(Campaign & { donations: Donation[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const fetchCampaign = () => {
    getCampaignById(params.id as string)
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("payment") === "cancel";

    if (sessionId) {
      let cancelled = false;

      void (async () => {
        try {
          await verifyDonation(sessionId);
          if (cancelled) return;
          setShowSuccessBanner(true);
          toast.success("Thank you! Your donation was received successfully 🎉");
          fetchCampaign();
          const t = setTimeout(() => {
            fetchCampaign();
          }, 1500);
          window.history.replaceState(null, "", window.location.pathname);
          return () => clearTimeout(t);
        } catch (error) {
          console.error("Failed to verify Stripe session after redirect", error);
          if (!cancelled) {
            toast.error("Payment completed, but confirmation is still pending.");
            fetchCampaign();
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (canceled || window.location.pathname.endsWith("cancel")) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname.replace("/cancel", "").replace("/success", "")
      );
    }
  }, [searchParams]);

  if (loading || !ready) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-slate-400">Campaign not found.</p>
      </div>
    );
  }

  const percentage = (campaign.raisedAmount / campaign.goalAmount) * 100;
  const image = getCategoryImage(campaign.category);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {showSuccessBanner ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Thank you! Your donation was received successfully 🎉
        </div>
      ) : null}

      {/* Hero Banner */}
      <div className="relative flex h-64 items-end overflow-hidden rounded-2xl bg-[#0A0F1E] lg:h-80">
        <img 
          src={image} 
          alt={campaign.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-[#050814]/60 to-black/20" />
        <div className="relative z-10 w-full max-w-4xl p-8">
          <span className="mb-4 inline-block rounded-full bg-black/50 border border-white/20 px-4 py-1.5 text-sm font-semibold tracking-wider text-white backdrop-blur-md">
            {campaign.category.toUpperCase()}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:w-3/4">
            {campaign.title}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column - Details */}
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 lg:p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">About this Campaign</h2>
            <div className="prose prose-invert max-w-none text-slate-300">
              <p className="whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
            </div>
            <div className="mt-8 flex items-center gap-4 rounded-xl bg-white/5 p-4 border border-white/10">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-white">Verified by PayShield</p>
                <p className="text-sm text-slate-400">This creator&apos;s identity and funds usage are strictly monitored.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 lg:p-8">
            <h2 className="mb-6 text-xl font-bold text-white">Recent Donors ({campaign._count?.donations || 0})</h2>
            <div className="space-y-4">
              {campaign.donations?.length === 0 ? (
                <p className="text-slate-500">Be the first to donate!</p>
              ) : (
                campaign.donations?.slice(0, 10).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{d.donor?.name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-white">₹{d.amount.toLocaleString("en-IN")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Widget */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 shadow-2xl">
            <div className="mb-6 space-y-2">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">₹{campaign.raisedAmount.toLocaleString("en-IN")}</span>
                <span className="mb-1 text-sm text-slate-400">raised</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Target className="size-4" />
                <span>Goal: ₹{campaign.goalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <ProgressBar percentage={percentage} color="bg-blue-500" showLabel />

            <div className="mt-6 flex items-center justify-between border-y border-white/10 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{campaign._count?.donations || 0}</p>
                <p className="text-xs text-slate-400">Donors</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">42</p>
                <p className="text-xs text-slate-400">Days Left</p>
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.4)] active:scale-95"
            >
              Donate Now
            </button>
            <p className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="size-3" /> Secure Payment via Stripe Checkout
            </p>
          </div>
        </div>
      </div>

      <DonateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        onSuccess={() => {
          fetchCampaign();
        }}
      />
    </motion.div>
  );
}
