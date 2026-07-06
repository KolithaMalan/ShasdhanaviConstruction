"use client";

import Link from "next/link";
import { KeyRound, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { getRoleConfig } from "@/config/roles";
import type { Role } from "@/types";

interface UserMenuProps {
  name: string;
  email: string;
  role: Role;
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const cfg = getRoleConfig(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-md transition-all hover:bg-white/10 active:scale-[0.98]"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-[#ff6b1a] to-[#0a2540] text-[11px] font-semibold text-white">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-none md:flex">
            <span className="text-xs font-medium text-foreground">{name}</span>
            <span className="text-[10px] text-muted-foreground">
              {cfg.shortLabel}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-[#ff6b1a] to-[#0a2540] text-sm font-semibold text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {email}
              </span>
              <Badge
                variant="secondary"
                className="mt-1.5 w-fit rounded-md text-[10px]"
              >
                {cfg.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="rounded-md">
          <Link href="/profile" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-md">
          <Link href="/profile" className="cursor-pointer">
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            // Clear the session, then hard-navigate to the public home page.
            void signOut({ redirect: false }).then(() => {
              window.location.href = "/";
            });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
