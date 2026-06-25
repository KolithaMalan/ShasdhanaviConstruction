"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface Settings {
  companyName: string;
  companyLogo: string;
  siteName: string;
  idCardValidityMonths: number;
  maxPhotoSizeKb: number;
  defaultGateLocation: string;
  emailNotifications: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((b) => setS(b))
      .catch(() => setS(null));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function save() {
    if (!s) return;
    start(async () => {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("Settings saved");
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="System Settings"
          description="Tune defaults, branding, and SMTP. All changes are audit-logged."
          actions={
            <Button onClick={save} disabled={!s || pending}
                    className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          }
        />
      </MotionWrapper>

      {!s ? <Skeleton className="h-96 w-full" /> : (
        <>
          <Section title="General">
            <Field id="companyName" label="Company Name" value={s.companyName} onChange={(v) => update("companyName", v)} />
            <Field id="siteName" label="Site Name" value={s.siteName} onChange={(v) => update("siteName", v)} />
            <Field id="companyLogo" label="Company Logo URL" value={s.companyLogo} onChange={(v) => update("companyLogo", v)} />
          </Section>

          <Section title="ID Cards & Gates">
            <Field id="validity" label="ID Card Validity (months)" type="number" value={String(s.idCardValidityMonths)}
                   onChange={(v) => update("idCardValidityMonths", Number(v) || 2)} />
            <Field id="gate" label="Default Gate Location" value={s.defaultGateLocation} onChange={(v) => update("defaultGateLocation", v)} />
            <Field id="photoSize" label="Max Photo Size (KB)" type="number" value={String(s.maxPhotoSizeKb)}
                   onChange={(v) => update("maxPhotoSizeKb", Number(v) || 500)} />
          </Section>

          <Section title="Email / SMTP">
            <ToggleRow label="Send email notifications" value={s.emailNotifications} onChange={(v) => update("emailNotifications", v)} />
            <Field id="smtpHost" label="SMTP Host" value={s.smtpHost} onChange={(v) => update("smtpHost", v)} />
            <Field id="smtpPort" label="SMTP Port" type="number" value={String(s.smtpPort)} onChange={(v) => update("smtpPort", Number(v) || 587)} />
            <Field id="smtpFrom" label="SMTP From Address" value={s.smtpFrom} onChange={(v) => update("smtpFrom", v)} />
          </Section>

          <Section title="Maintenance Mode">
            <ToggleRow label="Enable maintenance mode" value={s.maintenanceMode} onChange={(v) => update("maintenanceMode", v)} />
            <div className="space-y-1.5">
              <Label htmlFor="msg">Maintenance Message</Label>
              <Textarea id="msg" rows={3} value={s.maintenanceMessage} onChange={(e) => update("maintenanceMessage", e.target.value)} />
            </div>
          </Section>

          {/* spacer */}
          <SettingsIcon className="hidden" />
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <MotionWrapper delay={0.05}>
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </MotionWrapper>
  );
}

function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <Checkbox checked={value} onCheckedChange={(v) => onChange(!!v)} />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
