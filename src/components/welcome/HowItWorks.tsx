"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  LogIn,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  Cpu,
  QrCode,
  CloudCog,
  Bell,
  Zap,
  Leaf,
  Clock,
  FileCheck2,
  Activity,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Step {
  src: string;
  step: string;
  title: string;
  description: string;
}

/**
 * The three site photos (bg1 → bg3) walk through the power-plant build
 * in order: groundworks first, structure second, commissioning last.
 */
const steps: Step[] = [
  {
    src: "/bg1.png",
    step: "Stage 01",
    title: "Site preparation & groundworks",
    description:
      "The first phase: land clearing, excavation and foundation works for the power plant. Access control and gate passes go live so only cleared personnel can enter the site.",
  },
  {
    src: "/bg2.png",
    step: "Stage 02",
    title: "Structural & mechanical build",
    description:
      "The second phase: the main plant structure, turbines and heavy mechanical assemblies are erected. Contractor crews scale up and HSEQ compliance is monitored continuously.",
  },
  {
    src: "/bg3.png",
    step: "Stage 03",
    title: "Commissioning & power generation",
    description:
      "The final phase: electrical systems, testing and commissioning before the plant comes online. Full CCTV and incident management keep every zone secure to handover.",
  },
];

interface Feature {
  icon: LucideIcon;
  label: string;
  text: string;
}

/** What "going digital" actually means in day-to-day operations. */
const techFeatures: Feature[] = [
  {
    icon: QrCode,
    label: "Digital gate passes",
    text: "No more paper. Every pass is issued, scanned and verified electronically at the gate.",
  },
  {
    icon: CloudCog,
    label: "Cloud dashboards",
    text: "Security, HSEQ and admin teams work from live, role-based dashboards — anywhere, anytime.",
  },
  {
    icon: Bell,
    label: "Instant notifications",
    text: "Approvals, access codes and alerts reach the right people by email the moment they happen.",
  },
  {
    icon: Activity,
    label: "Real-time monitoring",
    text: "Site access, PPE compliance and incidents are tracked as they occur, not days later.",
  },
];

interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** The tangible wins users get from the digital system. */
const benefits: Benefit[] = [
  {
    icon: Clock,
    title: "Faster site entry",
    body: "Pre-approved, scannable passes mean shorter queues at the gate and less time lost at shift change.",
  },
  {
    icon: FileCheck2,
    title: "Reduce paperwork",
    body: "Registrations, approvals and records are fully digital — nothing to print, file or lose.",
  },
  {
    icon: ShieldCheck,
    title: "Safer site",
    body: "Live HSEQ tracking and instant incident reporting help everyone go home safe, every day.",
  },
  {
    icon: Lock,
    title: "Tighter security",
    body: "Role-based access ensures only cleared personnel reach the zones they're authorised for.",
  },
  {
    icon: Zap,
    title: "Quicker decisions",
    body: "Managers approve contractor and employee requests in a few clicks, keeping work moving.",
  },
  {
    icon: Leaf,
    title: "Greener operations",
    body: "Going paperless cuts waste and keeps a clean, searchable digital trail of every action.",
  },
];

interface Guide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const guides: Guide[] = [
  {
    icon: ShieldCheck,
    title: "What this system is for",
    body: "It is a single, secure control point for the power-plant construction project — managing who enters the site, tracking HSEQ safety compliance, and recording every incident. It keeps the right people on site and everyone else out.",
  },
  {
    icon: LogIn,
    title: "How to sign in",
    body: "Each role (security, HSEQ, contractor, admin and more) has its own login. Use the Login button at the top, enter your registered email and the access code sent to you, and you land on the dashboard built for your role.",
  },
  {
    icon: Mail,
    title: "Always use a working email",
    body: "Sign-in codes and approval notices are sent by email. Register with an inbox you can actually open — if the address is wrong or unmonitored, you will not receive your code and cannot get on site.",
  },
  {
    icon: UserPlus,
    title: "Contractors: requesting extra employees",
    body: "Need more workers on site? Open Contractor Registration, submit each new employee's details and documents, and the request is sent for approval. Once approved, they receive their own login and gate pass by email.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export function HowItWorks() {
  return (
    <>
      {/* ───────────────  WE'VE GONE DIGITAL  ─────────────── */}
      <section
        id="digital"
        className="relative overflow-hidden border-b border-border/60 py-24"
      >
        {/* ambient glow background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-sky/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[320px] w-[520px] rounded-full bg-brand-ocean/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-sky] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Now fully digitalized
            </span>
            <h2 className="font-heading text-3xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
              We&apos;ve gone digital — technology now runs our{" "}
              <span className="bg-linear-to-r from-brand-sky via-brand-sage to-brand-ocean bg-clip-text text-transparent">
                site operations
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Shasdhanavi Construction has moved its entire security and
              compliance workflow online. From the gate to the control room,
              paperwork is replaced with a fast, secure and transparent digital
              platform — built for everyone working on the power-plant project.
            </p>
          </motion.div>

          {/* tech feature cards */}
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {techFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                {...reveal}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl bg-linear-to-b from-white/10 to-white/[0.02] p-px shadow-lg shadow-black/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-sky/10"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-brand-sky/40 via-transparent to-brand-ocean/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative h-full rounded-[calc(1rem-1px)] bg-card/80 p-6 backdrop-blur-xl">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-sky/25 to-brand-ocean/15 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-[--color-brand-sky]" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {f.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────  CONSTRUCTION STAGES (image cards)  ─────────────── */}
      <section
        id="how-it-works"
        className="relative border-b border-border/60 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...reveal} className="mb-12 max-w-2xl">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-sky]">
              The build, stage by stage
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              From groundbreaking to power generation
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              The photos below follow the three stages of the power-plant build —
              and at every stage this digital system controls site access, safety
              and security for the people on the ground.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.article
                key={item.src}
                {...reveal}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl bg-linear-to-b from-white/10 to-white/[0.02] p-px shadow-lg shadow-black/5 transition-shadow duration-300 hover:shadow-2xl hover:shadow-brand-sky/10"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-brand-sky/40 via-transparent to-brand-ocean/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-card/80 backdrop-blur-xl">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute -bottom-3 right-3 font-heading text-7xl font-bold leading-none text-white/10 transition-colors duration-300 group-hover:text-white/20">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-sky" />
                      {item.step}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────  BENEFITS YOU GET  ─────────────── */}
      <section
        id="benefits"
        className="relative overflow-hidden border-b border-border/60 py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute right-1/2 top-1/3 h-[360px] w-[640px] translate-x-1/2 rounded-full bg-brand-sage/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...reveal} className="mb-12 max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-sky]">
              <Cpu className="h-3.5 w-3.5" />
              What you get
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The benefits of going digital
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Whether you&apos;re at the gate, in the field, or in the office,
              the digital platform makes your day faster, safer and simpler.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                {...reveal}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-brand-sky/40 hover:bg-card/60 hover:shadow-xl hover:shadow-brand-sky/5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-sky/20 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-sky/25 to-brand-ocean/15 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                  <b.icon className="h-5 w-5 text-[--color-brand-sky]" />
                </div>
                <h3 className="relative font-heading text-base font-semibold text-foreground">
                  {b.title}
                </h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {b.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────  HOW TO USE IT (guidance)  ─────────────── */}
      <section className="relative border-b border-border/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...reveal} className="mb-12 max-w-2xl">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-sky]">
              Getting started
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How to use the system
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              A quick guide for everyone — from first sign-in to adding more
              workers to your crew.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {guides.map((guide, i) => (
              <motion.div
                key={guide.title}
                {...reveal}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-brand-sky/40 hover:bg-card/60 hover:shadow-xl hover:shadow-brand-sky/5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-sky/20 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-sky/25 to-brand-ocean/15 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                  <guide.icon className="h-5 w-5 text-[--color-brand-sky]" />
                </div>
                <div className="relative">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {guide.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {guide.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA banner */}
          <motion.div
            {...reveal}
            className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-navy via-brand-ocean to-brand-navy p-px"
          >
            <div className="relative flex flex-col items-start justify-between gap-6 rounded-[calc(1.5rem-1px)] bg-brand-navy/80 px-8 py-10 backdrop-blur-xl sm:flex-row sm:items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-sky/20 blur-3xl"
              />
              <div className="relative max-w-xl">
                <h3 className="font-heading text-2xl font-semibold text-white">
                  Ready to get on site?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Log in to your dashboard, or — if you&apos;re a contractor —
                  register your crew and request additional employees in minutes.
                </p>
              </div>
              <div className="relative flex flex-wrap gap-3">
                <Link
                  href="#login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-lg transition-all hover:bg-white/90 active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/contractor-registration"
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  Request employees
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
