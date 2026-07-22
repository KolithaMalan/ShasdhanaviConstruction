"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Loader2, Save, SlidersHorizontal, Zap, LayoutGrid, RotateCcw, PanelLeft, Check,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getRoleConfig } from "@/config/roles";
import type { FeatureDef, ToggleableRole } from "@/lib/features";

interface RoleFeatures {
  role: ToggleableRole;
  disabled: string[];
  pages: FeatureDef[];
  actions: FeatureDef[];
}

/** Unsaved edits per role, so switching roles in the side panel never loses work. */
type DraftMap = Record<string, string[]>;

export default function RoleFeaturesPage() {
  const [roles, setRoles] = useState<RoleFeatures[] | null>(null);
  const [active, setActive] = useState<ToggleableRole | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/super-admin/role-features")
      .then((r) => r.json())
      .then((b) => {
        const list: RoleFeatures[] = b.roles ?? [];
        setRoles(list);
        setDrafts(Object.fromEntries(list.map((r) => [r.role, r.disabled])));
        const first = list[0];
        if (first) setActive(first.role);
      })
      .catch(() => setRoles([]));
  }, []);

  const current = useMemo(
    () => roles?.find((r) => r.role === active) ?? null,
    [roles, active],
  );
  const draft = active ? (drafts[active] ?? []) : [];

  /** Roles whose draft differs from what's saved — flagged in the side panel. */
  const dirtyRoles = useMemo(() => {
    const out = new Set<string>();
    for (const r of roles ?? []) {
      const d = drafts[r.role] ?? [];
      if ([...r.disabled].sort().join("|") !== [...d].sort().join("|")) out.add(r.role);
    }
    return out;
  }, [roles, drafts]);

  const dirty = !!active && dirtyRoles.has(active);

  function setDraft(next: string[]) {
    if (!active) return;
    setDrafts((prev) => ({ ...prev, [active]: next }));
  }

  function toggle(key: string, enabled: boolean) {
    setDraft(enabled ? draft.filter((k) => k !== key) : [...new Set([...draft, key])]);
  }

  function setAll(enabled: boolean) {
    if (!current) return;
    setDraft(enabled ? [] : [...current.pages, ...current.actions].map((f) => f.key));
  }

  function save() {
    if (!current) return;
    start(async () => {
      const res = await fetch("/api/super-admin/role-features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: current.role, disabled: draft }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message ?? "Failed to save");
        return;
      }
      const saved: string[] = body.disabled ?? draft;
      setRoles((prev) =>
        (prev ?? []).map((r) => (r.role === current.role ? { ...r, disabled: saved } : r)),
      );
      setDrafts((prev) => ({ ...prev, [current.role]: saved }));
      toast.success(`${getRoleConfig(current.role).label} updated`, {
        description: "Users of this role see the change on their next page load.",
      });
    });
  }

  function selectRole(role: ToggleableRole) {
    setActive(role);
    setMobileOpen(false);
  }

  const rolePanel = (
    <RolePanel
      roles={roles ?? []}
      drafts={drafts}
      active={active}
      dirtyRoles={dirtyRoles}
      onSelect={selectRole}
    />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="Role Features"
          description="Pick a role in the side panel, then switch its screens and actions on or off. Turning a screen off hides it from that role's sidebar and blocks the page; turning an action off stops the operation itself."
          actions={
            <div className="flex items-center gap-2">
              {/* Role picker on small screens, where the side panel is hidden */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-lg lg:hidden">
                    <PanelLeft className="mr-2 h-4 w-4" />
                    {active ? getRoleConfig(active).shortLabel : "Roles"}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="border-b border-border/60 px-4 py-4">
                    <SheetTitle className="text-left">Roles</SheetTitle>
                  </SheetHeader>
                  <div className="p-3">{rolePanel}</div>
                </SheetContent>
              </Sheet>

              <Button
                onClick={save}
                disabled={!dirty || pending}
                className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 disabled:opacity-40"
              >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </div>
          }
        />
      </MotionWrapper>

      {roles === null ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)]">
          {/* ── Side panel (desktop) ── */}
          <MotionWrapper delay={0.05}>
            <aside className="sticky top-24 hidden lg:block">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-2 backdrop-blur-md">
                <p className="px-3 pb-2 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Roles
                </p>
                {rolePanel}
              </div>
              <p className="mt-3 px-1 text-[11px] leading-snug text-muted-foreground">
                Super Admin is not listed — its own access can never be switched
                off from here.
              </p>
            </aside>
          </MotionWrapper>

          {/* ── Detail pane ── */}
          {current && (
            <MotionWrapper delay={0.08} key={current.role}>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-heading text-sm font-semibold">
                      {getRoleConfig(current.role).label}
                      {dirty && (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                          Unsaved
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {getRoleConfig(current.role).description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setAll(true)}>
                      Enable all
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setAll(false)}>
                      Disable all
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-lg"
                      disabled={!dirty}
                      onClick={() => setDraft(current.disabled)}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Revert
                    </Button>
                  </div>
                </div>

                <FeatureSection
                  icon={Zap}
                  title="Actions"
                  hint="What this role is allowed to DO. Blocked at the API, so it cannot be bypassed."
                  features={current.actions}
                  disabled={draft}
                  onToggle={toggle}
                />

                <FeatureSection
                  icon={LayoutGrid}
                  title="Dashboard screens"
                  hint="Sidebar entries. Turning one off hides the link and blocks the page. The role's own dashboard home is always available."
                  features={current.pages}
                  disabled={draft}
                  onToggle={toggle}
                />
              </div>
            </MotionWrapper>
          )}
        </div>
      )}
    </div>
  );
}

/** The list of roles rendered inside the side panel (and the mobile sheet). */
function RolePanel({
  roles, drafts, active, dirtyRoles, onSelect,
}: {
  roles: RoleFeatures[];
  drafts: DraftMap;
  active: ToggleableRole | null;
  dirtyRoles: Set<string>;
  onSelect: (role: ToggleableRole) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {roles.map((r) => {
        const cfg = getRoleConfig(r.role);
        const total = r.pages.length + r.actions.length;
        const off = (drafts[r.role] ?? r.disabled).length;
        const isActive = active === r.role;

        return (
          <button
            key={r.role}
            type="button"
            onClick={() => onSelect(r.role)}
            className={cn(
              "group relative flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all active:scale-[0.99]",
              isActive
                ? "bg-accent/15 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            )}
          >
            {isActive && (
              <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-[--color-brand-orange]" />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                {cfg.shortLabel}
                {dirtyRoles.has(r.role) && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    aria-label="Unsaved changes"
                  />
                )}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                {off === 0 ? `All ${total} on` : `${total - off} of ${total} on`}
              </span>
            </span>
            {off > 0 ? (
              <Badge className="mt-0.5 shrink-0 rounded-md bg-amber-500/15 text-[10px] font-semibold text-amber-600">
                {off} off
              </Badge>
            ) : (
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function FeatureSection({
  icon: Icon,
  title,
  hint,
  features,
  disabled,
  onToggle,
}: {
  icon: typeof SlidersHorizontal;
  title: string;
  hint: string;
  features: FeatureDef[];
  disabled: string[];
  onToggle: (key: string, enabled: boolean) => void;
}) {
  if (features.length === 0) return null;

  const offCount = features.filter((f) => disabled.includes(f.key)).length;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[--color-brand-ocean]" />
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {features.length - offCount}/{features.length}
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{hint}</p>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {features.map((f) => {
          const enabled = !disabled.includes(f.key);
          return (
            <label
              key={f.key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                enabled
                  ? "border-border/60 bg-background/40 hover:border-border"
                  : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <Checkbox
                className="mt-0.5"
                checked={enabled}
                onCheckedChange={(v) => onToggle(f.key, !!v)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{f.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {f.description}
                </span>
                {!enabled && (
                  <span className="mt-1 inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                    Disabled
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
