"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Role } from "@/types";
import { getRoleConfig } from "@/config/roles";
import { visibleNavForRole } from "@/lib/features";

interface SidebarProps {
  role: Role;
  /** Feature keys the Super Admin has switched off for this role. */
  disabledFeatures?: string[];
}

export function Sidebar({ role, disabledFeatures = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const cfg = getRoleConfig(role);
  const nav = visibleNavForRole(role, disabledFeatures);

  return (
    <TooltipProvider delayDuration={120}>
      <motion.aside
        animate={{ width: collapsed ? 72 : 264 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl md:flex",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border/60 px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <Logo showText={false} size="sm" />
          ) : (
            <Logo size="sm" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {cfg.shortLabel}
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== cfg.dashboardPath && pathname.startsWith(item.href));

              const linkInner = (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    "hover:bg-accent/10 hover:text-foreground",
                    "active:scale-[0.98]",
                    active
                      ? "bg-accent/15 text-foreground shadow-sm"
                      : "text-muted-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-[--color-brand-orange]"
                    />
                  )}
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate font-medium">{item.label}</span>
                  )}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkInner}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.href}>{linkInner}</div>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border/60 p-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-all",
              "hover:bg-accent/10 hover:text-foreground active:scale-[0.98]",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
