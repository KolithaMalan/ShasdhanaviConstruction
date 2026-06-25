"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/GradientMesh";
import { Logo } from "@/components/shared/Logo";

export default function RegistrationSuccessPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <GradientMesh />

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl"
        >
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[--color-brand-ocean]/40 via-transparent to-[--color-brand-sky]/40 opacity-70 blur-sm" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-10 text-center backdrop-blur-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/40"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </motion.div>

            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
              Registration Received
            </p>
            <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">
              Your request has been submitted
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              The Shasdhanavi Admin team has been notified and will review your
              registration. You will receive an email once the outcome is ready.
            </p>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg border border-[--color-brand-ocean]/30 bg-[--color-brand-ocean]/5 px-4 py-2 text-xs text-[--color-brand-ocean]">
              <Mail className="h-3.5 w-3.5" />
              Check your inbox for confirmation
            </div>

            <div className="mt-8">
              <Button asChild className="h-11 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90">
                <Link href="/">Back to Welcome</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
