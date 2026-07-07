import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-8 w-8", text: "text-sm", sub: "text-[10px]", px: 32 },
  md: { box: "h-10 w-10", text: "text-base", sub: "text-[11px]", px: 40 },
  lg: { box: "h-14 w-14", text: "text-xl", sub: "text-xs", px: 56 },
} as const;

export function Logo({
  href = "/",
  className,
  showText = true,
  size = "md",
}: LogoProps) {
  const s = sizes[size];

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
          "bg-gradient-to-br from-[#146C94] via-[#7FC7D9] to-[#19183B]",
          "ring-1 ring-inset ring-white/15",
          s.box,
        )}
      >
        <Image
          src="/Sahas.png"
          alt={`${siteConfig.searchName} — ${siteConfig.company} logo`}
          width={s.px}
          height={s.px}
          className="h-full w-full object-contain p-0.5"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-heading font-semibold tracking-tight text-foreground",
              s.text,
            )}
          >
            {siteConfig.shortName}
          </span>
          <span className={cn("text-muted-foreground", s.sub)}>
            Construction Security
          </span>
        </div>
      )}
    </Link>
  );
}
