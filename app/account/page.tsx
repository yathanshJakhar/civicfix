"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { accountApi, useMyIssues, type Account, type ContractorRecord } from "@/lib/api";
import { departmentLabel, homeFor, useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<Account["role"], string> = {
  citizen: "Citizen",
  authority: "Department officer",
  admin: "Admin",
  contractor: "Contractor",
};

/** Profile, email preferences and (for citizens) a summary of their tickets. */
export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [contractor, setContractor] = useState<ContractorRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const citizen = user?.role === "citizen";
  const { issues } = useMyIssues(citizen);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await accountApi.get();
      setAccount(data.account);
      setContractor(data.contractor);
      setName(data.account.name);
      setPhone(data.account.phone ?? "");
      setNotify(data.account.notifyUpdates);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
  }, [signedIn, load]);

  const stats = useMemo(() => {
    if (!issues) return null;
    return {
      total: issues.length,
      open: issues.filter((i) => i.status === "Open").length,
      progress: issues.filter((i) => i.status === "In Progress").length,
      resolved: issues.filter((i) => i.status === "Resolved").length,
      upvotes: issues.reduce((n, i) => n + i.upvotes, 0),
    };
  }, [issues]);

  const dirty =
    !!account && (name.trim() !== account.name || (phone.trim() || null) !== account.phone || notify !== account.notifyUpdates);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const { account: a } = await accountApi.update({ name: name.trim(), phone: phone.trim() || null, notifyUpdates: notify });
      setAccount(a);
      setName(a.name);
      setPhone(a.phone ?? "");
      setNotify(a.notifyUpdates);
      await refresh(); // the top bar shows the name from the session
      setSaveMsg({ ok: true, text: "Saved." });
    } catch (err) {
      setSaveMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    const ok = confirm(
      "Delete your CivicFix account?\n\nYour tickets stay with the departments so the problems still get fixed, but they'll no longer be linked to you and you won't get updates. This can't be undone.",
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await accountApi.remove();
      await refresh();
      router.replace("/login");
    } catch (err) {
      setSaveMsg({ ok: false, text: (err as Error).message });
      setDeleting(false);
    }
  }

  if (authLoading) return <PageHeader title="Account" />;

  if (!user) {
    return (
      <>
        <PageHeader title="Account" />
        <div className="px-4 pt-5">
          <EmptyState title="Not signed in">
            <Link href="/login" className="btn btn-primary mt-5">
              Sign in
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const sectionHead = "font-cond text-base font-bold uppercase tracking-[0.06em] text-ink";

  return (
    <>
      <PageHeader title="Account" subtitle={ROLE_LABEL[user.role]} />

      {loadError ? (
        <div className="px-4 pt-4">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      ) : !account ? (
        <p className="px-4 pt-4 text-sm text-dim">Loading…</p>
      ) : (
        <div className="space-y-5 px-4 pb-6 pt-4">
          {/* Who you are */}
          <section className="ticket grid grid-cols-[minmax(0,1fr)_5.75rem]">
            <div className="min-w-0 px-4 py-3.5">
              <p className="label">{ROLE_LABEL[account.role]}</p>
              <p className="mt-1.5 truncate text-xl font-semibold leading-tight text-ink">{account.name}</p>
              <p className="mt-1 truncate text-[13px] text-dim">{account.email}</p>
              {(user.role === "authority" || user.role === "admin") && (
                <p className="mt-1 text-[13px] text-saffron">{departmentLabel(user)}</p>
              )}
            </div>
            <div className="perf-y stub flex flex-col items-center justify-center gap-1 px-1">
              {citizen ? (
                <>
                  <span className="figure text-[2.25rem] font-bold leading-none text-saffron">{stats?.total ?? "–"}</span>
                  <span className="label">Tickets</span>
                </>
              ) : (
                <Link href={homeFor(user)} className="label text-center text-saffron underline underline-offset-4">
                  Home
                </Link>
              )}
            </div>
          </section>

          {/* Citizen: their ticket record */}
          {citizen && (
            <section>
              <h2 className={`${sectionHead} mb-2`}>Your reports</h2>
              <dl className="grid grid-cols-4 border border-line-strong bg-panel text-center">
                <Stat label="Open" value={stats?.open} />
                <Stat label="Working" value={stats?.progress} />
                <Stat label="Fixed" value={stats?.resolved} />
                <Stat label="Upvotes" value={stats?.upvotes} />
              </dl>
              <div className="mt-2 flex gap-2">
                <Link href="/tickets" className="btn btn-secondary flex-1">
                  My tickets
                </Link>
                <Link href="/report" className="btn btn-primary flex-1">
                  Report an issue
                </Link>
              </div>
            </section>
          )}

          {/* Contractor: the registration the department made */}
          {contractor && (
            <section className="ticket p-4">
              <h2 className={sectionHead}>Contractor registration</h2>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[15px]">
                <dt className="label pt-0.5">Company</dt>
                <dd className="text-ink">{contractor.name}</dd>
                <dt className="label pt-0.5">Works for</dt>
                <dd className="text-ink">{contractor.departments.join(", ")}</dd>
                <dt className="label pt-0.5">Phone</dt>
                <dd className="text-ink">{contractor.phone ?? "—"}</dd>
                <dt className="label pt-0.5">Active jobs</dt>
                <dd className="figure text-saffron">{contractor.activeCount ?? "—"}</dd>
              </dl>
              <p className="mt-2 text-[13px] text-faint">
                Company details and the phone citizens see are managed by your department. Ask them to update it.
              </p>
            </section>
          )}

          {/* Editable profile and preferences */}
          <form onSubmit={save} className="ticket space-y-4 px-4 pb-5 pt-4" noValidate>
            <h2 className={sectionHead}>Profile</h2>
            <label className="block">
              <span className="label mb-2 block">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className="field" />
            </label>
            <label className="block">
              <span className="label mb-2 block">
                Phone <span className="normal-case tracking-normal text-faint">(optional)</span>
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98xxx xxxxx"
                className="field"
              />
            </label>
            <label className="block">
              <span className="label mb-2 block">Email</span>
              <input value={account.email} disabled className="field opacity-60" />
              <span className="mt-1.5 block text-[13px] text-faint">You sign in with this, so it can&apos;t be changed.</span>
            </label>

            {citizen && (
              <label className="flex items-start gap-3 border border-line-strong bg-panel px-3 py-3">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-[15px] font-medium text-ink">Email me ticket updates</span>
                  <span className="block text-[13px] text-dim">
                    When a contractor is assigned or posts progress on your tickets. You&apos;ll always get the confirmation
                    when you report something.
                  </span>
                </span>
              </label>
            )}

            {saveMsg && (
              <p className={`text-sm ${saveMsg.ok ? "text-fixed" : "text-open"}`} role={saveMsg.ok ? "status" : "alert"}>
                {saveMsg.text}
              </p>
            )}
            <button type="submit" disabled={saving || !dirty || !name.trim()} className="btn btn-primary w-full">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>

          <section className="space-y-2">
            <button onClick={logout} className="btn btn-secondary w-full">
              Sign out
            </button>
            {citizen && (
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="btn w-full border-open bg-panel text-open hover:bg-raised"
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="border-l border-line-strong py-2.5 first:border-l-0">
      <dd className="figure text-xl font-bold leading-none text-ink">{value ?? "–"}</dd>
      <dt className="label mt-1">{label}</dt>
    </div>
  );
}
