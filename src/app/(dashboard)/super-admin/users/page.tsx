"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AtSign, KeyRound, Loader2, MoreHorizontal, Plus, Search, ShieldBan, ShieldCheck, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getInitials } from "@/lib/utils";
import { ROLE_VALUES, type Role } from "@/types";
import { getRoleConfig } from "@/config/roles";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyName: string | null;
  brNumber: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Staff roles whose sign-in email the Super Admin may change from here.
 * Contractor emails are deliberately excluded — they are tied to the approved
 * contractor registration record.
 */
const EMAIL_EDITABLE_ROLES: Role[] = [
  "ADMIN_HSEQ",
  "MEDICAL_OFFICER",
  "HSEQ_OFFICER",
  "INTERNAL_SECURITY",
];

export default function SuperAdminUsersPage() {
  const [items, setItems] = useState<UserRow[] | null>(null);
  const [role, setRole] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState<UserRow | null>(null);
  const [emailTarget, setEmailTarget] = useState<UserRow | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (role !== "ALL") params.set("role", role);
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/super-admin/users?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, [role, status, q]);

  function toggleActive(u: UserRow) {
    start(async () => {
      const res = await fetch(`/api/super-admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success(u.isActive ? `${u.name} blocked` : `${u.name} unblocked`);
      load();
    });
  }

  function resetPassword(u: UserRow) {
    start(async () => {
      const res = await fetch(`/api/super-admin/users/${u.id}/reset-password`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success(`Password reset for ${u.email}`, {
        description: `New password: ${body.temporaryPassword}`,
      });
      setResetConfirm(null);
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="User Management"
          description="All accounts across every role. Create, edit, reset passwords, block."
          actions={
            <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setTempPwd(null); }}>
              <DialogTrigger asChild>
                <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                  <Plus className="mr-2 h-4 w-4" /> Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CreateUserForm
                  onCreated={(pw) => { setTempPwd(pw); load(); }}
                  tempPwd={tempPwd}
                  onClose={() => setCreateOpen(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 pl-9" placeholder="Email or name…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {ROLE_VALUES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={UserPlus} title="No users" /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead aria-label="actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-[10px] font-bold text-white">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{u.name}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-mono text-[10px]">
                        {getRoleConfig(u.role).shortLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.companyName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={
                        "rounded-md " + (u.isActive
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-red-500/15 text-red-600")
                      }>{u.isActive ? "Active" : "Blocked"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={pending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {EMAIL_EDITABLE_ROLES.includes(u.role) && (
                            <DropdownMenuItem onSelect={() => setEmailTarget(u)} disabled={pending}>
                              <AtSign className="mr-2 h-4 w-4" /> Change email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => setResetConfirm(u)} disabled={pending}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset password
                          </DropdownMenuItem>
                          {u.isActive ? (
                            <DropdownMenuItem onSelect={() => toggleActive(u)} disabled={pending}
                                              className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <ShieldBan className="mr-2 h-4 w-4" /> Block
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => toggleActive(u)} disabled={pending}>
                              <ShieldCheck className="mr-2 h-4 w-4" /> Unblock
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         )}
      </MotionWrapper>

      <Dialog open={!!emailTarget} onOpenChange={(v) => { if (!v) setEmailTarget(null); }}>
        <DialogContent className="max-w-md">
          {emailTarget && (
            <ChangeEmailForm
              user={emailTarget}
              onClose={() => setEmailTarget(null)}
              onSaved={() => { setEmailTarget(null); load(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!resetConfirm} onOpenChange={(v) => { if (!v) setResetConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              A new temporary password will be generated and emailed to {resetConfirm?.email}. They will be required to change it on next sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (resetConfirm) resetPassword(resetConfirm); }}
                               disabled={pending}
                               className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Changes a staff account's sign-in email. */
function ChangeEmailForm({
  user, onSaved, onClose,
}: { user: UserRow; onSaved: () => void; onClose: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [pending, start] = useTransition();

  const next = email.trim().toLowerCase();
  const changed = next !== user.email.toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next);

  function submit() {
    start(async () => {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed to change email"); return; }
      toast.success("Email changed", {
        description: `${user.name} now signs in with ${next}.`,
      });
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change sign-in email</DialogTitle>
        <DialogDescription>
          {user.name} · {getRoleConfig(user.role).label}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Current email</Label>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-sm text-muted-foreground">
            {user.email}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-email">New email</Label>
          <Input
            id="ce-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && changed && valid) submit(); }}
          />
          {changed && !valid && (
            <p className="text-[11px] text-destructive">Enter a valid email address.</p>
          )}
        </div>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
          They must use the new email to sign in from now on. Their password is
          unchanged — tell them before you save.
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={pending || !changed || !valid}
          className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AtSign className="mr-2 h-4 w-4" />}
          Save email
        </Button>
      </DialogFooter>
    </>
  );
}

function CreateUserForm({
  onCreated, tempPwd, onClose,
}: { onCreated: (pw: string) => void; tempPwd: string | null; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ADMIN_HSEQ");
  const [companyName, setCompanyName] = useState("");
  const [brNumber, setBrNumber] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, name, role,
          ...(role === "CONTRACTOR" && { companyName, brNumber }),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("User created");
      onCreated(body.temporaryPassword);
    });
  }

  if (tempPwd) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>User created</DialogTitle>
          <DialogDescription>The new account is ready. Share these credentials securely.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border/60 bg-background/60 p-4 font-mono text-sm">
          <div>Email: <span className="font-semibold">{email}</span></div>
          <div>Temp password: <span className="font-semibold">{tempPwd}</span></div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create User</DialogTitle>
        <DialogDescription>A secure temporary password will be auto-generated.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cu-email">Email</Label>
          <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-name">Name</Label>
          <Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_VALUES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {role === "CONTRACTOR" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="cu-company">Company Name</Label>
              <Input id="cu-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-br">BR Number</Label>
              <Input id="cu-br" value={brNumber} onChange={(e) => setBrNumber(e.target.value)} />
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button onClick={submit} disabled={pending || !email || !name}
                className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create
        </Button>
      </DialogFooter>
    </>
  );
}
