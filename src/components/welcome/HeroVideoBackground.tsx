"use client";

import { cn } from "@/lib/utils";

interface HeroVideoBackgroundProps {
  /** Optional override for the video file (must live in /public). */
  src?: string;
  /** Darken the video so foreground text remains legible. 0–1. */
  overlayOpacity?: number;
  className?: string;
}

/**
 * Full-bleed muted-autoplay video background for the welcome hero.
 * Pairs a video element with a deep-navy overlay + brand gradient tint so the
 * hero text and login card stay readable on any frame.
 *
 * To revert to the static gradient mesh, swap `<HeroVideoBackground />` for
 * `<GradientMesh />` inside HeroSection.tsx — nothing else changes.
 */
export function HeroVideoBackground({
  src = "/Homevideo.mp4",
  overlayOpacity = 0.55,
  className,
}: HeroVideoBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Dark wash so the hero text stays readable */}
      <div
        className="absolute inset-0 bg-[#19183B]"
        style={{ opacity: overlayOpacity }}
      />

      {/* Brand gradient tint — matches the rest of the palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19183B]/70 via-[#146C94]/25 to-[#7FC7D9]/20" />

      {/* Soft grid overlay (matches the rest of the site) */}
      <div className="absolute inset-0 grid-pattern" />

      {/* Edge accents */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7FC7D9]/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#146C94]/40 to-transparent" />
    </div>
  );
}
