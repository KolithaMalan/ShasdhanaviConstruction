"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { roleToDashboard } from "@/config/roles";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

type Phase = "CREDS" | "CODE";
const CODE_LENGTH = 5;

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("CREDS");
  const [codeDigits, setCodeDigits] = useState<string[]>(() =>
    Array(CODE_LENGTH).fill(""),
  );
  const [resendIn, setResendIn] = useState(0);
  const [shake, setShake] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");

  const code = useMemo(() => codeDigits.join(""), [codeDigits]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /* Resend cooldown ticker */
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  /* Focus first OTP cell when entering CODE phase */
  useEffect(() => {
    if (phase === "CODE") {
      const id = window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  function triggerShake() {
    setShake((n) => n + 1);
  }

  async function completeSignIn(role?: Role) {
    const target = (role && roleToDashboard[role]) || "/";
    toast.success("Welcome back", { description: "Redirecting…" });
    router.push(target);
    router.refresh();
  }

  /* Phase 1 — verify credentials, request a 2FA code if contractor */
  function onSubmitCreds(data: LoginInput) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/2fa/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          triggerShake();
          toast.error(body.message ?? "Sign in failed", {
            description:
              res.status === 429
                ? "Please wait a moment and try again."
                : undefined,
          });
          if (res.status === 429 && body.retryAfterSeconds) {
            setResendIn(body.retryAfterSeconds);
            setLiveMessage(
              `Rate limited. Try again in ${body.retryAfterSeconds} seconds.`,
            );
          }
          return;
        }

        if (body.requires2fa === true) {
          setCodeDigits(Array(CODE_LENGTH).fill(""));
          setResendIn(30);
          setPhase("CODE");
          setLiveMessage(`Verification code sent to ${data.email}.`);
          toast.success("Verification code sent", {
            description: `Check ${data.email} for a ${CODE_LENGTH}-digit code.`,
          });
          return;
        }

        /* Non-contractor — single-step sign in */
        const signInRes = await signIn("credentials", {
          email: data.email.toLowerCase().trim(),
          password: data.password,
          redirect: false,
        });
        if (!signInRes || signInRes.error) {
          triggerShake();
          toast.error("Sign in failed", { description: "Please try again." });
          return;
        }
        const session = await fetch("/api/auth/session").then((r) => r.json());
        completeSignIn(session?.user?.role as Role | undefined);
      } catch {
        triggerShake();
        toast.error("Network error");
      }
    });
  }

  /* Phase 2 — finalize sign-in with the code */
  function submitCode() {
    if (code.length !== CODE_LENGTH) {
      triggerShake();
      toast.error(`Enter the ${CODE_LENGTH}-digit code`);
      return;
    }
    const creds = getValues();
    startTransition(async () => {
      const signInRes = await signIn("credentials", {
        email: creds.email.toLowerCase().trim(),
        password: creds.password,
        code,
        redirect: false,
      });
      if (!signInRes || signInRes.error) {
        triggerShake();
        if (
          signInRes?.code === "two_factor_invalid" ||
          signInRes?.error?.includes("two_factor_invalid")
        ) {
          toast.error("Invalid or expired code", {
            description: "Please try again or request a new code.",
          });
          setLiveMessage("Invalid or expired code. Try again.");
          setCodeDigits(Array(CODE_LENGTH).fill(""));
          otpRefs.current[0]?.focus();
        } else {
          toast.error("Sign in failed");
        }
        return;
      }
      const session = await fetch("/api/auth/session").then((r) => r.json());
      completeSignIn(session?.user?.role as Role | undefined);
    });
  }

  function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    submitCode();
  }

  async function resendCode() {
    if (resendIn > 0 || pending) return;
    const creds = getValues();
    startTransition(async () => {
      const res = await fetch("/api/auth/2fa/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message ?? "Resend failed");
        if (res.status === 429 && body.retryAfterSeconds) {
          setResendIn(body.retryAfterSeconds);
          setLiveMessage(
            `Rate limited. Try again in ${body.retryAfterSeconds} seconds.`,
          );
        }
        return;
      }
      setCodeDigits(Array(CODE_LENGTH).fill(""));
      setResendIn(30);
      setLiveMessage("New code sent.");
      toast.success("New code sent");
      otpRefs.current[0]?.focus();
    });
  }

  function goBack() {
    setPhase("CREDS");
    setCodeDigits(Array(CODE_LENGTH).fill(""));
    setLiveMessage("");
  }

  /* OTP segment helpers */
  function setDigitAt(index: number, char: string) {
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
  }

  function handleOtpChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigitAt(index, "");
      return;
    }
    // Single-character path
    if (raw.length === 1) {
      setDigitAt(index, raw);
      if (index < CODE_LENGTH - 1) otpRefs.current[index + 1]?.focus();
      return;
    }
    // Paste / multi-character typed into one cell — distribute
    distribute(raw, index);
  }

  function distribute(raw: string, startIndex: number) {
    const chars = raw.slice(0, CODE_LENGTH - startIndex).split("");
    setCodeDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => {
        next[startIndex + i] = c;
      });
      return next;
    });
    const lastIndex = Math.min(startIndex + chars.length, CODE_LENGTH) - 1;
    window.setTimeout(() => {
      const target =
        lastIndex < CODE_LENGTH - 1
          ? otpRefs.current[lastIndex + 1]
          : otpRefs.current[CODE_LENGTH - 1];
      target?.focus();
      // If we just filled the whole code, auto-submit
      if (startIndex + chars.length >= CODE_LENGTH) {
        submitCode();
      }
    }, 0);
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (codeDigits[index]) {
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        otpRefs.current[index - 1]?.focus();
        setDigitAt(index - 1, "");
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    distribute(text, index);
  }

  const submitEmail = getValues("email");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md"
    >
      <div className="absolute -inset-px rounded-2xl bg-linear-to-br from-brand-sky/40 via-transparent to-brand-ocean/30 opacity-60 blur-sm" />

      <motion.div
        key={shake}
        animate={
          shake > 0
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl"
      >
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-ocean">
            {phase === "CREDS" ? "Authorized Personnel" : "Two-Step Verification"}
          </p>
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={2}
            aria-valuenow={phase === "CREDS" ? 1 : 2}
            aria-label="Sign-in progress"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Step {phase === "CREDS" ? "1" : "2"}/2
            </span>
            <span className="flex gap-1">
              <span
                className={cn(
                  "h-1 w-6 rounded-full transition-colors",
                  "bg-brand-ocean",
                )}
              />
              <span
                className={cn(
                  "h-1 w-6 rounded-full transition-colors",
                  phase === "CODE" ? "bg-brand-ocean" : "bg-border/60",
                )}
              />
            </span>
          </div>
        </div>

        {/* aria-live region — silent for sighted users, announces to AT */}
        <p className="sr-only" role="status" aria-live="polite">
          {liveMessage}
        </p>

        <AnimatePresence mode="wait">
          {phase === "CREDS" ? (
            <motion.div
              key="creds"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 space-y-1.5">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {intent === "contractor"
                    ? "Contractor Sign In"
                    : "Sign in to your console"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Contractor accounts use an email verification step.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmitCreds, triggerShake)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@sahasdhanavi.lk"
                      disabled={pending}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={cn(
                        "h-11 rounded-lg border-border/60 bg-background/60 pl-9 font-mono text-sm transition-shadow",
                        "focus-visible:ring-2 focus-visible:ring-brand-ocean/40",
                        errors.email &&
                          "ring-2 ring-destructive/60 border-destructive/60",
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={pending}
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                      className={cn(
                        "h-11 rounded-lg border-border/60 bg-background/60 pl-9 pr-10 text-sm transition-shadow",
                        "focus-visible:ring-2 focus-visible:ring-brand-ocean/40",
                        errors.password &&
                          "ring-2 ring-destructive/60 border-destructive/60",
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className="group h-11 w-full rounded-lg bg-brand-ocean text-white shadow-lg shadow-brand-ocean/20 transition-all hover:bg-brand-ocean/90 hover:shadow-brand-ocean/30 active:scale-[0.98] active:shadow-md disabled:opacity-70"
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Continuing…
                    </>
                  ) : (
                    <>
                      Continue{" "}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                <p className="pt-1 text-center text-[11px] text-muted-foreground">
                  By signing in you agree to the site safety rules and the use
                  of CCTV monitoring.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 space-y-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-ocean/10 text-brand-ocean">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  Enter your {CODE_LENGTH}-digit code
                </h2>
                <p className="text-sm text-muted-foreground">
                  We sent a code to{" "}
                  <span className="font-mono text-foreground">{submitEmail}</span>
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={pending}
                    className="ml-1.5 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                    aria-label="Use a different email"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  . It expires in 5 minutes.
                </p>
              </div>

              <form onSubmit={onSubmitCode} className="space-y-5">
                <div
                  role="group"
                  aria-label="Verification code"
                  className="flex justify-between gap-2"
                >
                  {codeDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={(e) => handleOtpPaste(i, e)}
                      onFocus={(e) => e.currentTarget.select()}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      disabled={pending}
                      aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                      className={cn(
                        "h-14 w-12 rounded-xl border bg-background/60 text-center font-mono text-2xl font-semibold tabular-nums shadow-sm outline-none transition-all",
                        "border-border/60",
                        "focus:border-brand-ocean focus:ring-2 focus:ring-brand-ocean/40",
                        digit && "border-brand-ocean/60 bg-brand-ocean/5",
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={pending || code.length !== CODE_LENGTH}
                  aria-busy={pending}
                  className="h-11 w-full rounded-lg bg-brand-ocean text-white shadow-lg shadow-brand-ocean/20 transition-all hover:bg-brand-ocean/90 hover:shadow-brand-ocean/30 active:scale-[0.98] active:shadow-md disabled:opacity-50"
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify & Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={pending}
                    className="inline-flex cursor-pointer items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Use a different account
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={pending || resendIn > 0}
                    aria-live="polite"
                    className="cursor-pointer text-brand-ocean transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
