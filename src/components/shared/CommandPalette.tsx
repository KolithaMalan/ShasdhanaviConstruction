"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2, ClipboardList, FileBarChart, IdCard, LayoutDashboard,
  Loader2, ScanLine, Search, Settings, Truck, User, Users, Wrench,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { roleToDashboard } from "@/config/roles";
import type { Role } from "@/types";

interface SearchResults {
  employees: Array<{ id: string; name: string; nicNumber: string; employeeId: string | null; companyName: string; status: string; tradeType: string }>;
  contractors: Array<{ id: string; companyName: string; email: string; brNumber: string }>;
  vehicles: Array<{ id: string; vehicleNumber: string; vehicleType: string; companyName: string; vehicleQrId: string; currentStatus: string }>;
  visitors: Array<{ id: string; name: string; nicNumber: string; passId: string; company: string; currentStatus: string }>;
  equipment: Array<{ id: string; toolName: string; equipmentId: string; companyName: string; currentBalance: number; status: string }>;
  nonElectricalTools: Array<{ id: string; toolName: string; toolId: string; companyName: string; currentBalance: number; approvedQuantity: number; unit: string; status: string }>;
}

interface Props {
  role: Role;
}

export function CommandPalette({ role }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  /* Global hotkey */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Listen for the topbar button click */
  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener("open-command-palette", onOpen);
    return () => window.removeEventListener("open-command-palette", onOpen);
  }, []);

  /* Debounced search */
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) { setResults(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((b) => setResults(b))
        .catch(() => { /* aborted/network */ })
        .finally(() => setLoading(false));
    }, 300);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [q, open]);

  const quickActions = useMemo(() => {
    const list: Array<{ label: string; icon: typeof Search; href: string; hint?: string }> = [
      { label: "Go to my Dashboard", icon: LayoutDashboard, href: roleToDashboard[role] },
      { label: "Open Notifications", icon: Settings, href: "/notifications" },
      { label: "My Profile", icon: User, href: "/profile" },
    ];
    if (role === "SUPER_ADMIN") {
      list.push({ label: "Reports Center", icon: FileBarChart, href: "/super-admin/reports" });
      list.push({ label: "System Settings", icon: Settings, href: "/super-admin/settings" });
      list.push({ label: "Audit Log", icon: ClipboardList, href: "/super-admin/audit-log" });
    }
    if (role === "ADMIN_HSEQ") {
      list.push({ label: "Reports", icon: FileBarChart, href: "/admin/reports" });
    }
    if (role === "SECURITY_OFFICER" || role === "SUPER_ADMIN") {
      list.push({ label: "Open Scan Workstation", icon: ScanLine, href: "/security" });
    }
    return list;
  }, [role]);

  function go(url: string) {
    setOpen(false);
    setQ("");
    router.push(url);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          <div className="absolute inset-x-0 top-[12vh] mx-auto w-full max-w-2xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            >
              <Command label="Command palette" loop>
                <div className="flex items-center gap-3 border-b border-border/60 px-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Command.Input
                    value={q}
                    onValueChange={setQ}
                    placeholder="Search employees, contractors, vehicles, tools…"
                    className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  />
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <kbd className="hidden items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                  {q.trim().length < 2 && (
                    <Command.Group heading="Quick actions">
                      <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Quick actions
                      </p>
                      {quickActions.map((a) => (
                        <Item key={a.href} icon={a.icon} title={a.label} onSelect={() => go(a.href)} />
                      ))}
                    </Command.Group>
                  )}

                  {results && (
                    <>
                      <Section title="Employees" icon={Users} items={results.employees} render={(e) => (
                        <Item key={e.id} icon={Users}
                              title={e.name}
                              subtitle={`${e.nicNumber} · ${e.companyName} · ${e.tradeType}`}
                              meta={e.status}
                              onSelect={() => go(`/super-admin/employees?focus=${e.id}`)} />
                      )} />
                      <Section title="Contractors" icon={Building2} items={results.contractors} render={(c) => (
                        <Item key={c.id} icon={Building2}
                              title={c.companyName}
                              subtitle={`${c.email} · ${c.brNumber}`}
                              onSelect={() => go(`/super-admin/contractors?focus=${c.id}`)} />
                      )} />
                      <Section title="Vehicles" icon={Truck} items={results.vehicles} render={(v) => (
                        <Item key={v.id} icon={Truck}
                              title={v.vehicleNumber}
                              subtitle={`${v.vehicleType} · ${v.companyName}`}
                              meta={v.currentStatus}
                              onSelect={() => go(`/admin/vehicles/${v.id}`)} />
                      )} />
                      <Section title="Visitors" icon={IdCard} items={results.visitors} render={(v) => (
                        <Item key={v.id} icon={IdCard}
                              title={v.name}
                              subtitle={`${v.nicNumber} · ${v.company}`}
                              meta={v.currentStatus}
                              onSelect={() => go(`/admin/visitor-history?passId=${v.passId}`)} />
                      )} />
                      <Section title="Electrical Equipment" icon={Zap} items={results.equipment} render={(e) => (
                        <Item key={e.id} icon={Zap}
                              title={e.toolName}
                              subtitle={`${e.equipmentId} · ${e.companyName}`}
                              meta={`bal ${e.currentBalance}`}
                              onSelect={() => go(`/admin/tools-inventory/electrical/${e.id}`)} />
                      )} />
                      <Section title="Non-Electrical Tools" icon={Wrench} items={results.nonElectricalTools} render={(t) => (
                        <Item key={t.id} icon={Wrench}
                              title={t.toolName}
                              subtitle={`${t.toolId} · ${t.companyName}`}
                              meta={`${t.currentBalance}/${t.approvedQuantity} ${t.unit}`}
                              onSelect={() => go(`/admin/tools-inventory/non-electrical/${t.id}`)} />
                      )} />
                    </>
                  )}

                  <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                    {q.trim().length < 2 ? "Start typing to search…" : "No results found."}
                  </Command.Empty>
                </Command.List>
              </Command>
            </motion.div>
            <p className="mt-3 text-center text-[11px] text-white/50">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘ K</kbd> to open · arrow keys to navigate · enter to select
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section<T>({
  title, icon: Icon, items, render,
}: {
  title: string; icon: typeof Search; items: T[]; render: (item: T) => React.ReactNode;
}) {
  if (!items || items.length === 0) return null;
  return (
    <Command.Group>
      <div className="flex items-center gap-2 px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {title}
      </div>
      {items.map((it) => render(it))}
    </Command.Group>
  );
}

function Item({
  icon: Icon, title, subtitle, meta, onSelect,
}: {
  icon: typeof Search; title: string; subtitle?: string; meta?: string; onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent/15"
      value={`${title} ${subtitle ?? ""}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle && <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>}
      </span>
      {meta && <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{meta}</span>}
    </Command.Item>
  );
}
