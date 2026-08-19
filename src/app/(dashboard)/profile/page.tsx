"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, KeyRound, Loader2, Mail, Pencil, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { getRoleConfig } from "@/config/roles";
import type { Role } from "@/types";

const ALLOWED_EMAIL_CHANGE_ROLES: Role[] = [
  "ADMIN_HSEQ",
  "MEDICAL_OFFICER",
  "HSEQ_OFFICER",
  "SECURITY_OFFICER",
  "INTERNAL_SECURITY",
];

interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyName: string | null;
  brNumber: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  mustChangePassword: boolean;
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a digit")
      .regex(/[^A-Za-z0-9]/, "Must include a symbol"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function strengthScore(pw: string): { score: number; label: string; tone: string } {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw)) s += 1;
  if (/[a-z]/.test(pw)) s += 1;
  if (/[0-9]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  const labels = ["Empty", "Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const tones = ["bg-muted", "bg-red-500", "bg-red-400", "bg-amber-500", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"];
  return { score: s, label: labels[s] ?? "—", tone: tones[s] ?? "bg-muted" };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pending, start] = useTransition();

  /* ─── Email change state ─── */
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailPending, startEmailTransition] = useTransition();

  const canChangeEmail = profile
    ? ALLOWED_EMAIL_CHANGE_ROLES.includes(profile.role)
    : false;

  const {
    register, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPw = watch("newPassword");
  const strength = useMemo(() => strengthScore(newPw ?? ""), [newPw]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((b) => setProfile(b))
      .catch(() => setProfile(null));
  }, []);

  function onSubmit(values: PasswordForm) {
    start(async () => {
      const res = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("Password updated", { description: "Use the new password on next sign-in." });
      reset();
    });
  }

  function onEmailSave() {
    setEmailError("");
    if (!newEmail.trim()) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailError("Enter a valid email address");
      return;
    }
    startEmailTransition(async () => {
      const res = await fetch("/api/profile/change-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setEmailError(body.message ?? "Failed to update email"); return; }
      toast.success("Email updated", { description: `Changed to ${body.email}` });
      setProfile((p) => p ? { ...p, email: body.email } : p);
      setEditingEmail(false);
    });
  }

  const cfg = profile ? getRoleConfig(profile.role) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Account"
          title="My Profile"
          description="Personal account details and security."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          {!profile ? <Skeleton className="h-32 w-full" /> : (
            <div className="flex flex-wrap items-start gap-5">
              <Avatar className="h-20 w-20 ring-2 ring-[--color-brand-ocean]/30">
                <AvatarFallback className="bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-xl font-bold text-white">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-2xl font-semibold">{profile.name}</h2>
                <p className="font-mono text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-md">{cfg?.label ?? profile.role}</Badge>
                  {profile.isActive ? (
                    <Badge className="rounded-md bg-emerald-500/15 text-emerald-600">Active</Badge>
                  ) : (
                    <Badge className="rounded-md bg-red-500/15 text-red-600">Blocked</Badge>
                  )}
                  {profile.mustChangePassword && (
                    <Badge className="rounded-md bg-amber-500/15 text-amber-600">Must change password</Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  {profile.companyName && (
                    <Item label="Company" value={profile.companyName} icon={UserIcon} />
                  )}
                  {profile.brNumber && (
                    <Item label="BR Number" value={profile.brNumber} mono />
                  )}
                  <Item label="Member since" value={new Date(profile.createdAt).toLocaleDateString("en-GB")} />
                  <Item label="Last login" value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("en-GB") : "—"} />
                </div>
              </div>
            </div>
          )}
        </div>
      </MotionWrapper>

      {/* ─── Change Email (staff roles only) ─── */}
      {canChangeEmail && profile && (
        <MotionWrapper delay={0.07}>
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold">Email Address</h3>
                <p className="text-xs text-muted-foreground">Update the email used for login and notifications.</p>
              </div>
            </div>

            {!editingEmail ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted-foreground">{profile.email}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs"
                  onClick={() => { setNewEmail(profile.email); setEmailError(""); setEditingEmail(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                    className="h-11 max-w-md"
                    disabled={emailPending}
                    placeholder="new@example.com"
                    autoFocus
                  />
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    disabled={emailPending}
                    onClick={onEmailSave}
                    className="h-9 gap-1.5 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
                  >
                    {emailPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={emailPending}
                    onClick={() => { setEditingEmail(false); setEmailError(""); }}
                    className="h-9 gap-1.5 rounded-lg"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </MotionWrapper>
      )}

      <MotionWrapper delay={0.1}>
        <form onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Change Password</h3>
              <p className="text-xs text-muted-foreground">Min 8 chars · uppercase · lowercase · digit · symbol</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current Password</Label>
              <div className="relative">
                <Input id="current" type={showOld ? "text" : "password"} {...register("currentPassword")}
                       className="h-11 pr-10" disabled={pending} />
                <button type="button" tabIndex={-1} onClick={() => setShowOld((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new">New Password</Label>
              <div className="relative">
                <Input id="new" type={showNew ? "text" : "password"} {...register("newPassword")}
                       className="h-11 pr-10" disabled={pending} />
                <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              <div className="mt-1 flex items-center gap-3">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <span key={i} className={"flex-1 rounded-full " + (i <= strength.score ? strength.tone : "bg-muted")} />
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{strength.label}</span>
              </div>
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input id="confirm" type="password" {...register("confirmPassword")} className="h-11" disabled={pending} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <Button type="submit" disabled={pending}
                  className="h-11 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Update Password
          </Button>
        </form>
      </MotionWrapper>
    </div>
  );
}

function Item({
  label, value, mono, icon: Icon,
}: { label: string; value: string; mono?: boolean; icon?: typeof UserIcon }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <div>
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className={"text-sm " + (mono ? "font-mono" : "font-medium")}>{value}</dd>
      </div>
    </div>
  );
}
