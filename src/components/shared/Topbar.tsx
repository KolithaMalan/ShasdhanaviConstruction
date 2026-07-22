"use client";

import { Search } from "lucide-react";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserMenu } from "@/components/shared/UserMenu";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { MobileNav } from "@/components/shared/MobileNav";
import type { Role } from "@/types";

interface TopbarProps {
  name: string;
  email: string;
  role: Role;
  /** Feature keys the Super Admin has switched off for this role. */
  disabledFeatures?: string[];
}

export function Topbar({ name, email, role, disabledFeatures = [] }: TopbarProps) {
  function openPalette() {
    window.dispatchEvent(new Event("open-command-palette"));
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border/60 bg-background/60 px-3 backdrop-blur-xl sm:px-4 md:px-6 md:gap-4">
      <MobileNav role={role} disabledFeatures={disabledFeatures} />
      {/* Search trigger — opens the command palette */}
      <div className="flex flex-1 items-center">
        <button
          type="button"
          onClick={openPalette}
          className="flex h-9 w-full max-w-md items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-3 text-left text-sm text-muted-foreground transition-all hover:border-border hover:bg-card active:scale-[0.99]"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden flex-1 truncate sm:inline">Search employees, vehicles, tools…</span>
          <span className="flex-1 truncate sm:hidden">Search…</span>
          <kbd className="hidden items-center gap-1 rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        <NotificationDropdown />
        <ThemeToggle />
        <div className="ml-1 hidden h-8 w-px bg-border/60 sm:block" />
        <UserMenu name={name} email={email} role={role} />
      </div>

      {/* Mounted once on every dashboard page so Cmd+K works anywhere */}
      <CommandPalette role={role} />
    </header>
  );
}
