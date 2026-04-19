import { Shield, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

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
    'education': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=700&q=80',
    'health': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80',
    'environment': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&q=80',
    'relief': 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=700&q=80',
    'elderly': 'https://images.unsplash.com/photo-1447005497901-b3e9ee359928?w=700&q=80',
    // Fallback if water specific category exists
    'water': 'https://images.unsplash.com/photo-1538300342682-ffa5ba1b9186?w=700&q=80'
  };
  return map[normalized] || map['relief'];
};

const categoryBarColors: Record<string, string> = {
  Education: 'bg-blue-500',
  Health: 'bg-emerald-500', 
  Environment: 'bg-teal-500',
  Relief: 'bg-amber-500',
  Elderly: 'bg-purple-500',
};

const categoryColors: Record<string, string> = {
  Education: 'bg-blue-500/20 text-blue-300',
  Health: 'bg-emerald-500/20 text-emerald-300',
  Environment: 'bg-teal-500/20 text-teal-300', 
  Relief: 'bg-amber-500/20 text-amber-300',
  Elderly: 'bg-purple-500/20 text-purple-300',
};

export function CampaignCard({ id, title, description, goalAmount, raisedAmount, category, donorCount, index = 0 }: CampaignCardProps) {
  const percentage = (raisedAmount / goalAmount) * 100;
  const image = getCategoryImage(category);
  const barColor = categoryBarColors[category] || "bg-slate-500";
  const catColor = categoryColors[category] || "bg-slate-500/20 text-slate-300";

  return (
    <Link href={`/campaigns/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full"
      >
        {/* Image section */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl flex-shrink-0">
          <img 
            src={image}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-black/30 to-transparent" />
          
          {/* Category badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 ${catColor}`}>
              {category}
            </span>
          </div>
          
          {/* Verified shield */}
          <div className="absolute top-3 right-3">
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full p-1.5 shadow-lg">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
          
          {/* Progress section - dynamically pushed to bottom */}
          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white font-semibold">
                ₹{raisedAmount.toLocaleString('en-IN')} raised
              </span>
              <span className="text-gray-500">
                of ₹{goalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            {/* Animated progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {percentage.toFixed(0)}% funded
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Users className="w-4 h-4" />
              <span>{donorCount} donors</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <Heart className="w-3.5 h-3.5" />
              Donate
            </motion.button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
