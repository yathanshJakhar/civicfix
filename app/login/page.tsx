"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { departmentLabel, homeFor, isContractor, isStaff, useAuth, type Portal } from "@/lib/auth";
import { STAFF_SIGN_IN_WITHOUT_CODE } from "@/lib/flags";

type Step = "email" | "code";

const PORTALS: { id: Portal; label: string; subtitle: string; intro: string }[] = [
  {
    id: "citizen",
    label: "Citizen",
    subtitle: "Citizens of Delhi NCR",
    intro: "Report civic issues and follow them until they're fixed. New here? Your account is created when you verify.",
  },
  {
    id: "authority",
    label: "Department",
    subtitle: "Department officers",
    intro: "Officers sign in with their department email. Your department is set automatically from it.",
  },
  {
    id: "contractor",
    label: "Contractor",
    subtitle: "Registered contractors",
    intro: "See the work departments have assigned to you and update its progress.",
  },
];

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, requestCode, verifyCode } = useAuth();
  const [portal, setPortal] = useState<Portal>("citizen");
  const [step, setStep] = useState<Step>("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const meta = PORTALS.find((p) => p.id === portal)!;
  // Citizens always verify by email; staff skip it while STAFF_SIGN_IN_WITHOUT_CODE is on.
  const needsCode = portal === "citizen" || !STAFF_SIGN_IN_WITHOUT_CODE;

  function choosePortal(p: Portal) {
    setPortal(p);
    setStep("email");
    setCode("");
    setError(null);
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const next = await requestCode(email.trim(), portal);
      if (next) {
        // Staff signed in directly (no code while STAFF_SIGN_IN_WITHOUT_CODE is on).
        router.push(next);
        return;
      }
      setStep("code");
      setCode("");
      setCooldown(RESEND_SECONDS);
      setBusy(false);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      router.push(await verifyCode(email.trim(), portal, code, name.trim() || undefined));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!loading && user) {
    return (
      <>
        <PageHeader title="Log in" />
        <div className="px-4 pt-5">
          <div className="ticket px-5 py-6">
            <p className="label">Signed in</p>
            <p className="mt-1.5 text-xl font-semibold leading-tight text-ink">{user.name}</p>
            {isStaff(user) && <p className="mt-1 text-[15px] text-saffron">{departmentLabel(user)}</p>}
            {isContractor(user) && <p className="mt-1 text-[15px] text-saffron">Contractor</p>}
            <Link href={homeFor(user)} className="btn btn-primary mt-5 w-full">
              {isStaff(user) ? "Open dashboard" : isContractor(user) ? "Open my jobs" : "Go to my tickets"}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={step === "email" ? "Sign in" : "Enter code"} subtitle={meta.subtitle} />

      <div className="px-4 pt-5">
        {/* Three doors: citizens, department officers, contractors. */}
        <div role="tablist" aria-label="Sign in as" className="mb-4 grid grid-cols-3 border border-line-strong">
          {PORTALS.map((p) => {
            const on = p.id === portal;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => choosePortal(p.id)}
                className={`min-h-11 font-cond text-[13px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  on ? "bg-ink text-panel" : "bg-panel text-dim hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="ticket" noValidate>
            <div className="space-y-4 px-4 pb-5 pt-4">
              <p className="text-[15px] leading-snug text-dim">{meta.intro}</p>

              {portal === "citizen" && (
                <div>
                  <label htmlFor="name" className="label mb-2 block">
                    Name <span className="normal-case tracking-normal text-faint">(first time only)</span>
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    maxLength={80}
                    className="field"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="label mb-2 block">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="field"
                />
              </div>

              {error && <ErrorNote message={error} />}

              <button type="submit" disabled={busy || !email.trim()} className="btn btn-primary min-h-14 w-full text-lg">
                {needsCode ? (busy ? "Sending code…" : "Email me a code") : busy ? "Signing in…" : "Sign in"}
              </button>
            </div>
            <p className="perf-x stub px-4 py-3.5 text-center text-sm text-dim">
              {portal === "citizen"
                ? "No password needed. We'll email you a 6-digit code."
                : needsCode
                  ? "Accounts on this portal are issued by the CivicFix admin."
                  : "Testing mode: registered emails sign in without a code."}
            </p>
          </form>
        ) : (
          <form onSubmit={onVerify} className="ticket" noValidate>
            <div className="space-y-4 px-4 pb-5 pt-4">
              <p className="text-[15px] leading-snug text-dim">
                We sent a 6-digit code to <b className="text-ink">{email.trim()}</b>. It expires in 10 minutes.
              </p>
              <div>
                <label htmlFor="code" className="label mb-2 block">
                  Code
                </label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="000000"
                  className="field figure text-center text-2xl tracking-[0.4em]"
                />
              </div>

              {error && <ErrorNote message={error} />}

              <button type="submit" disabled={busy || code.length !== 6} className="btn btn-primary min-h-14 w-full text-lg">
                {busy ? "Checking…" : "Verify and sign in"}
              </button>
            </div>
            <div className="perf-x stub flex gap-2 p-4">
              <button type="button" onClick={() => choosePortal(portal)} className="btn btn-secondary flex-1">
                Change email
              </button>
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={busy || cooldown > 0}
                className="btn btn-secondary flex-1"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 border border-open bg-panel px-4 py-3 text-sm font-medium text-ink" role="alert">
      <span className="mt-1.5 h-2 w-2 shrink-0 bg-open" aria-hidden />
      {message}
    </p>
  );
}
