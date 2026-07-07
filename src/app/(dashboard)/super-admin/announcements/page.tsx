"use client";

import { useState, useTransition } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLE_VALUES, type Role } from "@/types";
import { getRoleConfig } from "@/config/roles";

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [pending, start] = useTransition();

  const allSelected = roles.length === 0;

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function submit() {
    start(async () => {
      const res = await fetch("/api/super-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, link, roles }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message ?? "Failed to send announcement");
        return;
      }
      toast.success("Announcement sent", {
        description: `Delivered to ${body.recipientCount} user${body.recipientCount === 1 ? "" : "s"}.`,
      });
      setTitle("");
      setMessage("");
      setLink("");
      setRoles([]);
    });
  }

  const canSend = title.trim().length >= 3 && message.trim().length >= 5;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="Announcements"
          description="Broadcast an in-app notification to every user of the selected roles."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">Compose announcement</h2>
              <p className="text-sm text-muted-foreground">
                Recipients see this in their notifications bell.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gate 2 closed tomorrow"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the details of your announcement…"
              maxLength={1000}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link">Link (optional)</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/admin/registrations"
              maxLength={300}
            />
            <p className="text-[11px] text-muted-foreground">
              Where recipients go when they click the notification. Leave blank for none.
            </p>
          </div>

          <div className="space-y-2.5">
            <Label>Recipients</Label>
            <label className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => setRoles([])}
              />
              <span className="text-sm font-medium">
                All roles
                <span className="ml-1 font-normal text-muted-foreground">
                  (default — everyone)
                </span>
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_VALUES.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <Checkbox
                    checked={roles.includes(r)}
                    onCheckedChange={() => toggleRole(r)}
                  />
                  <span className="text-sm font-medium">{getRoleConfig(r).label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button
              onClick={submit}
              disabled={pending || !canSend}
              className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send announcement
            </Button>
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
}
