"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllCampaigns, type Campaign } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

const CATEGORIES = ["All", "Education", "Health", "Environment", "Relief", "Elderly"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let mounted = true;
    getAllCampaigns()
      .then((data) => {
        if (mounted) {
          setCampaigns(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchQuery === '' || 
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || 
      campaign.category.trim().toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl scroll-pt-32">
      
      {/* Header — NOT sticky */}
      <div className="mb-6 ">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <span className="text-blue-400 text-sm font-medium tracking-wide uppercase">
            Verified Causes
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Discover Campaigns
        </h1>
        <p className="text-gray-400 text-base max-w-2xl">
          Every donation is protected by PayShield's real-time fraud detection algorithms, ensuring your impact reaches the intended hands.
        </p>
      </div>

      {/* Stats row — NOT sticky
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center shadow-lg">
          <p className="text-3xl font-bold text-white">{campaigns.length}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Active Campaigns</p>
        </div>
        <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <p className="text-3xl font-bold text-emerald-400">94%</p>
          <p className="text-xs text-emerald-500/70 mt-1 uppercase tracking-wider font-semibold">Fraud Blocked</p>
        </div>
        <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-blue-500/10 blur-2xl" />
          <p className="text-3xl font-bold text-blue-400">₹2.4Cr</p>
          <p className="text-xs text-blue-500/70 mt-1 uppercase tracking-wider font-semibold">Protected</p>
        </div>
      </div> */}

      {/* Sticky search + filter — sticks to top of scroll container */}
      <div className="sticky top-[-24px] md:top-[-40px] z-30 bg-[#050814]/95 backdrop-blur-md -mx-8 px-8 py-4 border-b border-white/5">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns by name or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0F1E] border border-white/10 rounded-2xl 
                       pl-14 pr-12 py-4 text-white placeholder-gray-500 
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50
                       focus:bg-white-[0.02] transition-all duration-300 text-base shadow-2xl"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-5 flex items-center text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5 bg-white/10 rounded-full p-0.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold 
                          transition-all duration-300 border
                          ${activeCategory === cat 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10'
                          }`}
            >
              {cat}
            </button>
          ))}
          {(searchQuery || activeCategory !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
              className="px-4 py-2 ml-2 rounded-xl text-sm font-semibold text-gray-500 
                         hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Spacer removed (cards pulled up) */}
      <div className="h-2 md:h-4" />

      {/* Results count */}
      {(!loading && (searchQuery || activeCategory !== 'All')) ? (
        <p className="text-sm font-medium text-gray-500 mb-6 px-1">
          Showing {filteredCampaigns.length} result{filteredCampaigns.length !== 1 ? 's' : ''}
          {searchQuery && <span className="text-gray-300"> for "{searchQuery}"</span>}
          {activeCategory !== 'All' && <span className="text-gray-300"> in {activeCategory}</span>}
        </p>
      ) : null}

      {/* Campaign grid */}
      {loading ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 items-stretch">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/5 border border-white/5 w-full" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] mt-4 pb-24"
        >
          <Search className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg mb-4">No campaigns found matching your criteria</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
            className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
          >
            Start over
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 items-stretch">
          <AnimatePresence>
            {filteredCampaigns.map((campaign, index) => (
              <CampaignCard
                key={campaign.id}
                {...campaign}
                donorCount={campaign._count?.donations || 0}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
}
