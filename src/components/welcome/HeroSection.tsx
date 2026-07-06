"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  HardHat,
  BadgeCheck,
  Radio,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/GradientMesh";
import { HeroVideoBackground } from "@/components/welcome/HeroVideoBackground";
import { ContractorCTA } from "@/components/welcome/ContractorCTA";
import { LoginCard } from "@/components/welcome/LoginCard";

const USE_VIDEO_BG = true;

const STATS = [
  { icon: HardHat, value: "7", label: "Operational roles" },
  { icon: ShieldCheck, value: "24/7", label: "Gate coverage" },
  { icon: BadgeCheck, value: "100%", label: "PPE compliance" },
] as const;

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const fade = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60">
      {USE_VIDEO_BG ? <HeroVideoBackground /> : <GradientMesh />}

      {/* Industrial corner-bracket frame — subtle, decorative only */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <CornerBracket className="left-4 top-4" rotate={0} />
        <CornerBracket className="right-4 top-4" rotate={90} />
        <CornerBracket className="left-4 bottom-4" rotate={-90} />
        <CornerBracket className="right-4 bottom-4" rotate={180} />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-16 pt-16 md:pb-24 md:pt-24 lg:grid-cols-2 lg:gap-16">
        {/* LEFT — copy */}
        <div className="flex flex-col justify-center">
          {/* Site identifier — adds industrial credibility */}
          <motion.div
            {...fade(0)}
            className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/55"
          >
            <span className="h-px w-6 bg-white/30" />
            <span>SHA-CSS · v2 · SECTOR 04</span>
          </motion.div>

          {/* Eyebrow status badge */}
          <motion.div
            {...fade(0.05)}
            className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Radio className="h-3.5 w-3.5 text-[--color-brand-sky]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/85">
              Phase 2 · Contractor Onboarding Live
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl"
          >
            Sahasdhanavi{" "}
            <span className="relative inline-block bg-linear-to-r from-brand-sky via-brand-sage to-brand-ocean bg-clip-text text-transparent">
              Construction Security
              <span
                aria-hidden
                className="absolute -inset-x-1 -bottom-1 h-px bg-linear-to-r from-transparent via-brand-sky/60 to-transparent"
              />
            </span>{" "}
            System
          </motion.h1>

          <motion.p
            {...fade(0.18)}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Smart, integrated access control, HSEQ compliance, and incident
            management for one of the country&apos;s largest power-plant
            construction projects — engineered for the people who keep the site
            safe.
          </motion.p>

          {/* CTA row — Login is primary, Contractor is secondary */}
          <motion.div
            {...fade(0.26)}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-xl bg-brand-navy px-6 text-white shadow-lg shadow-brand-navy/30 ring-1 ring-white/10 transition-all hover:bg-brand-navy-dark hover:shadow-xl hover:shadow-brand-navy/40 active:scale-[0.98]"
            >
              <Link href="#login">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Login
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <ContractorCTA />
          </motion.div>

          {/* Compliance microtag */}
          <motion.p
            {...fade(0.32)}
            className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45"
          >
            <Activity className="h-3 w-3 text-[--color-brand-sky]" />
            ISO 45001 · OSHA-aligned · CCTV monitored
          </motion.p>

          {/* Stats strip — mono numerals, dividers, tiny icons */}
          <motion.dl
            {...fade(0.4)}
            className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6"
          >
            {STATS.map(({ icon: Icon, value, label }, i) => (
              <div key={label} className={i === 0 ? "pr-5" : "px-5"}>
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/4 ring-1 ring-white/10">
                  <Icon className="h-3.5 w-3.5 text-[--color-brand-sky]" />
                </div>
                <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                  {value}
                </dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* RIGHT — login card */}
        <div
          id="login"
          className="flex items-center justify-center lg:justify-end"
        >
          <LoginCard />
        </div>
      </div>
    </section>
  );
}

function CornerBracket({
  className = "",
  rotate = 0,
}: {
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`absolute h-6 w-6 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className="absolute left-0 top-0 h-px w-5 bg-white/25" />
      <span className="absolute left-0 top-0 h-5 w-px bg-white/25" />
    </span>
  );
}
