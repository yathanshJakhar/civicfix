"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { departmentContractors, type ContractorRecord, type ContractorStatus } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { CONTRACTORS_COVER_ALL_NCR } from "@/lib/flags";
import { DELHI_CENTER } from "@/lib/utils";

const EMPTY = {
  email: "",
  name: "",
  phone: "",
  lat: String(DELHI_CENTER[0]),
  lng: String(DELHI_CENTER[1]),
  radiusKm: "10",
};

const STATUS_TEXT: Record<ContractorStatus, { label: string; className: string }> = {
  pending: { label: "Waiting for admin", className: "border-line-strong text-dim" },
  approved: { label: "Approved", className: "border-fixed text-fixed" },
  rejected: { label: "Not approved", className: "border-open text-open" },
};

/**
 * A department's contractors. Officers add new ones here; each waits for the admin's approval
 * before it can sign in or be assigned tickets.
 */
export default function DepartmentContractorsPage() {
  const { user, loading: authLoading } = useAuth();
  const isOfficer = user?.role === "authority" && !!user.department;
  const [list, setList] = useState<ContractorRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setList(await departmentContractors.list());
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isOfficer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    load();
  }, [isOfficer, load]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
  }

  function edit(c: ContractorRecord) {
    setForm({ email: c.email, name: c.name, phone: c.phone ?? "", lat: String(c.lat), lng: String(c.lng), radiusKm: String(c.radiusKm) });
    setEditingId(c.id);
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const body = {
      email: form.email.trim(),
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      lat: Number(form.lat),
      lng: Number(form.lng),
      radiusKm: Number(form.radiusKm),
    };
    try {
      if (editingId) {
        await departmentContractors.update(editingId, body);
        setNotice("Changes saved.");
      } else {
        await departmentContractors.propose(body);
        setNotice(`${body.name} was sent to the admin for approval. You'll get an email when it's decided.`);
      }
      reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function withdraw(c: ContractorRecord) {
    if (!confirm(`Withdraw ${c.name}?`)) return;
    try {
      await departmentContractors.withdraw(c.id);
      await load();
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((p) => {
      set("lat", p.coords.latitude.toFixed(5));
      set("lng", p.coords.longitude.toFixed(5));
    });
  }

  if (authLoading) return <PageHeader title="Contractors" />;

  if (!isOfficer) {
    return (
      <>
        <PageHeader title="Contractors" />
        <div className="px-4 pt-5">
          <EmptyState
            title="Department officers only"
            message={user?.role === "admin" ? "As admin you approve contractors on the Approvals page." : "Departments manage their own contractors here."}
          >
            <Link href={homeFor(user)} className="btn btn-primary mt-5">
              {user?.role === "admin" ? "Open approvals" : "Back"}
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const editing = editingId !== null ? list?.find((c) => c.id === editingId) : null;

  return (
    <>
      <PageHeader title="Contractors" subtitle={user.department ?? undefined} />

      <form onSubmit={save} className="ticket mx-4 mt-4 space-y-4 px-4 pb-5 pt-4" noValidate>
        <p className="label">{editing ? `Edit ${editing.name}` : "Add a contractor"}</p>
        {!editing && (
          <p className="text-[13px] text-dim">
            They&apos;ll work for <b className="text-ink">{user.department}</b>. The admin approves them before they can
            sign in or take tickets.
          </p>
        )}
        {editing?.status === "rejected" && (
          <p className="text-[13px] text-dim">Saving sends them back to the admin for another review.</p>
        )}

        <Field label="Company / name" value={form.name} onChange={(v) => set("name", v)} />
        <Field
          label={editing ? "Email (can't be changed)" : "Email (they sign in with this)"}
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          disabled={!!editing}
        />
        <Field label="Phone (shown to citizens)" value={form.phone} onChange={(v) => set("phone", v)} />

        <div>
          <p className="label mb-2">Base location and service radius</p>
          {CONTRACTORS_COVER_ALL_NCR && (
            <p className="mb-2 text-[13px] text-dim">
              For now every contractor covers all of Delhi NCR, so the radius isn&apos;t used. The base location still sorts
              them by distance when you assign work.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Latitude" value={form.lat} onChange={(v) => set("lat", v)} inputMode="decimal" />
            <Field label="Longitude" value={form.lng} onChange={(v) => set("lng", v)} inputMode="decimal" />
            <Field label="Radius km" value={form.radiusKm} onChange={(v) => set("radiusKm", v)} inputMode="decimal" />
          </div>
          <button type="button" onClick={useMyLocation} className="mt-2 font-cond text-sm font-bold uppercase tracking-[0.06em] text-saffron underline underline-offset-4">
            Use my current location
          </button>
        </div>

        {error && <p className="text-sm text-open" role="alert">{error}</p>}
        {notice && <p className="text-sm text-dim" role="status">{notice}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1">
            {saving ? "Saving…" : editing ? "Save changes" : "Send for approval"}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="pt-5" aria-label="Your contractors">
        <h2 className="px-4 pb-2 font-cond text-base font-bold uppercase tracking-[0.06em] text-ink">Your contractors</h2>
        {loadError ? (
          <div className="px-4">
            <ErrorState message={loadError} onRetry={load} />
          </div>
        ) : !list ? (
          <p className="px-4 text-sm text-dim">Loading…</p>
        ) : list.length === 0 ? (
          <div className="px-4">
            <EmptyState title="No contractors yet" message="Add one above so you can pass tickets on once it's approved." />
          </div>
        ) : (
          <ul className="border-t border-line-strong">
            {list.map((c) => {
              const mine = c.requestedDepartment === user.department;
              const s = STATUS_TEXT[c.status];
              return (
                <li key={c.id} className="border-b border-line-strong px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
                      <p className="truncate text-[13px] text-dim">
                        {c.email}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                      {c.status === "approved" && (
                        <p className="text-[13px] text-faint">
                          <span className="figure text-saffron">{c.activeCount}</span> active project{c.activeCount === 1 ? "" : "s"}
                          {c.departments.length > 1 && ` · also works for ${c.departments.filter((d) => d !== user.department).join(", ")}`}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 border px-2 py-0.5 font-cond text-xs font-bold uppercase tracking-[0.06em] ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                  {c.reviewNote && (
                    <p className="mt-1.5 border-l-2 border-line-strong pl-2.5 text-[13px] text-dim">
                      <span className="label mr-1.5">Admin</span>
                      {c.reviewNote}
                    </p>
                  )}
                  {mine && (
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => edit(c)} className="btn btn-secondary px-3 text-sm">
                        Edit
                      </button>
                      {c.status !== "approved" && (
                        <button onClick={() => withdraw(c)} className="btn btn-secondary px-3 text-sm">
                          Withdraw
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="label mb-2 block">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="field disabled:opacity-60"
      />
    </label>
  );
}
