"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

interface Props {
  registrationId: string;
  companyName: string;
  email: string;
  brNumber: string;
}

export function CreateAccountCard({ registrationId, companyName, email, brNumber }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ password: string } | null>(null);

  function submit() {
    start(async () => {
      const res = await fetch("/api/admin/create-contractor-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message ?? "Failed to create account");
        return;
      }
      setResult({ password: body.temporaryPassword });
      toast.success("Account created and credentials emailed");
    });
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <div>
            <h2 className="font-heading text-lg font-semibold">Account created</h2>
            <p className="text-sm text-muted-foreground">
              Credentials have been emailed to {email}.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-border/60 bg-background/60 p-5">
          <Field label="Email">
            <code className="font-mono text-sm">{email}</code>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(email)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
          </Field>
          <Field label="Temporary Password">
            <code className="font-mono text-sm">{result.password}</code>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.password)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
          </Field>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          The contractor will be asked to change this password on first sign-in.
        </p>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push("/admin/registrations")}
                  className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            Back to Registrations
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
          <UserPlus className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-xl font-semibold">Create contractor account</h2>
          <p className="text-sm text-muted-foreground">
            A unique temporary password will be generated and emailed automatically.
            The contractor must change it on first login.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-background/60 p-5 sm:grid-cols-3">
        <Item label="Company" value={companyName} />
        <Item label="Email" value={email} mono />
        <Item label="BR Number" value={brNumber} mono />
      </dl>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={pending}
          className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Create Account & Send Credentials
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">{children}</div>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}
