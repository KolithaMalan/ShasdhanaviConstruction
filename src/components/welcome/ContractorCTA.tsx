"use client";

import Link from "next/link";
import { ArrowRight, HardHat } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ContractorCTAProps {
  className?: string;
}

export function ContractorCTA({ className }: ContractorCTAProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn("inline-flex", className)}
    >
      <Link
        href="/contractor-registration"
        className={cn(
          "group relative inline-flex items-center gap-3 overflow-hidden rounded-xl",
          "bg-gradient-to-r from-[#146C94] via-[#1a82af] to-[#7FC7D9]",
          "px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#146C94]/25",
          "transition-all hover:shadow-xl hover:shadow-[#146C94]/35",
        )}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
        <HardHat className="h-5 w-5 shrink-0" />
        <span>Contractor Self Registration Request</span>
        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
