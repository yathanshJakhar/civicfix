"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { LocationPicker } from "@/components/map";
import { api, useIssues } from "@/lib/api";
import { CATEGORIES, isActive, type Category } from "@/lib/types";
import { getUpvoted, haversine, setUpvoted } from "@/lib/utils";

type LatLng = { lat: number; lng: number };
type LocState =
  | { kind: "locating" }
  | { kind: "gps"; accuracy: number }
  | { kind: "manual" }
  | { kind: "error"; message: string };

const DUPLICATE_RADIUS_M = 100;

/** Shrink large phone photos to max 1600px JPEG so uploads stay fast. Falls back to the original. */
async function downscale(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function geoErrorMessage(err: GeolocationPositionError | null): string {
  if (!err) return "Location isn't available in this browser.";
  if (err.code === err.PERMISSION_DENIED) return "Location permission was denied.";
  if (err.code === err.TIMEOUT) return "Finding your location took too long.";
  return "Couldn't determine your location.";
}

export default function ReportPage() {
  const router = useRouter();
  const { issues } = useIssues();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [location, setLocation] = useState<LatLng | null>(null);
  const [loc, setLoc] = useState<LocState>({ kind: "locating" });
  const [showPicker, setShowPicker] = useState(false);

  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation || !window.isSecureContext) {
      setLoc({
        kind: "error",
        message: window.isSecureContext
          ? geoErrorMessage(null)
          : "Location needs HTTPS (use ngrok on your phone).",
      });
      setShowPicker(true);
      return;
    }
    setLoc({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoc({ kind: "gps", accuracy: pos.coords.accuracy });
      },
      (err) => {
        setLoc({ kind: "error", message: geoErrorMessage(err) });
        setShowPicker(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-detect location on load
    locate();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function pickOnMap(p: LatLng) {
    setLocation(p);
    setLoc({ kind: "manual" });
  }

  // Duplicate awareness: same category within 100 m.
  const nearby = useMemo(() => {
    if (!issues || !location || !category) return [];
    return issues
      .filter((i) => isActive(i) && i.category === category)
      .map((i) => ({ issue: i, distance: haversine(location.lat, location.lng, i.lat, i.lng) }))
      .filter((x) => x.distance <= DUPLICATE_RADIUS_M)
      .sort((a, b) => a.distance - b.distance);
  }, [issues, location, category]);

  const dupKey = location && category ? `${category}|${location.lat.toFixed(5)}|${location.lng.toFixed(5)}` : null;
  const showDuplicates = nearby.length > 0 && dismissedKey !== dupKey;

  async function upvoteExisting(id: string) {
    setUpvotingId(id);
    setError(null);
    try {
      if (!getUpvoted().includes(id)) {
        await api.patch(id, { action: "upvote" });
        setUpvoted(id, true);
      }
      router.push(`/issue/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setUpvotingId(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Please add a short title.");
    if (!category) return setError("Please choose a category.");
    if (!location) return setError("Please set the issue location.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("description", description.trim());
      form.set("category", category);
      form.set("lat", String(location.lat));
      form.set("lng", String(location.lng));
      if (photo) form.set("photo", await downscale(photo));
      const issue = await api.create(form);
      router.push(`/issue/${issue.id}`);
    } catch (e) {
      setError((e as Error).message || "Couldn't submit. Please try again.");
      setSubmitting(false);
    }
  }

  const labelCls = "mb-1.5 block text-sm font-bold text-zinc-200";
  const inputCls =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-3 text-[15px] text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none";

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Takes less than a minute" />

      <form onSubmit={onSubmit} className="space-y-5 px-4 pt-4" noValidate>
        {/* Photo */}
        <section>
          <label className={labelCls}>Photo</label>
          {preview ? (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={preview} alt="Selected photo preview" className="max-h-72 w-full object-cover" />
              <div className="flex gap-2 p-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="h-11 flex-1 rounded-lg bg-white text-sm font-bold text-black"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="h-11 rounded-lg border border-zinc-700 px-5 text-sm font-bold text-rose-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-36 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-violet-500 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                <circle cx="12" cy="13.5" r="3.5" />
              </svg>
              <span className="text-sm font-bold">Take or choose a photo</span>
              <span className="text-xs text-zinc-500">Optional, but it helps a lot</span>
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            className="hidden"
          />
        </section>

        {/* Title */}
        <section>
          <label htmlFor="title" className={labelCls}>
            Title <span className="text-violet-400">*</span>
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Deep pothole near the bus stop"
            className={inputCls}
          />
        </section>

        {/* Category */}
        <section>
          <label htmlFor="category" className={labelCls}>
            Category <span className="text-violet-400">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={`${inputCls} h-12 ${category ? "" : "text-zinc-500"}`}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="text-white">
                {c}
              </option>
            ))}
          </select>
        </section>

        {/* Description */}
        <section>
          <label htmlFor="description" className={labelCls}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What's the problem? Any landmark nearby?"
            className={`${inputCls} resize-none`}
          />
        </section>

        {/* Location */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-200">
                Location <span className="text-violet-400">*</span>
              </p>
              <p className="mt-0.5 text-sm text-zinc-400">
                {loc.kind === "locating" && "Detecting your location…"}
                {loc.kind === "gps" && `Using your current location (±${Math.round(loc.accuracy)} m)`}
                {loc.kind === "manual" && "Pinned on the map"}
                {loc.kind === "error" && (location ? "Pinned on the map" : `${loc.message} Tap the map to pick a spot.`)}
              </p>
              {location && (
                <p className="mt-1 font-mono text-xs text-violet-300">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>
            {loc.kind === "locating" ? (
              <span className="mt-1 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />
            ) : (
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${location ? "bg-emerald-400" : "bg-amber-400"}`} />
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={locate}
              disabled={loc.kind === "locating"}
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-bold text-black disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Use my location
            </button>
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="h-12 rounded-xl border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-zinc-500"
            >
              {showPicker ? "Hide map" : "Pick on map"}
            </button>
          </div>

          {showPicker && (
            <div className="mt-3">
              <div className="h-60 overflow-hidden rounded-lg border border-zinc-800">
                <LocationPicker value={location} onChange={pickOnMap} />
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Tap the map to place the pin, or drag it to adjust.</p>
            </div>
          )}
        </section>

        {/* Duplicate banner */}
        {showDuplicates && (
          <section className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4" role="alert">
            <p className="flex items-center gap-2 font-bold text-amber-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3 2 20h20L12 3Z" />
                <path d="M12 10v4M12 17h.01" />
              </svg>
              {nearby.length} similar issue{nearby.length === 1 ? "" : "s"} already reported nearby
            </p>
            <ul className="mt-3 space-y-1.5">
              {nearby.map(({ issue, distance }) => (
                <li key={issue.id}>
                  <Link
                    href={`/issue/${issue.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm hover:border-zinc-700"
                  >
                    <span className="min-w-0 truncate font-semibold text-zinc-100">{issue.title}</span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {Math.round(distance)} m · {issue.upvotes} upvotes
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => upvoteExisting(nearby[0].issue.id)}
                disabled={upvotingId !== null}
                className="min-h-12 flex-1 rounded-xl bg-amber-400 px-3 py-2 text-sm leading-tight font-bold text-black disabled:opacity-60"
              >
                {upvotingId ? "Upvoting…" : "Upvote existing instead"}
              </button>
              <button
                type="button"
                onClick={() => setDismissedKey(dupKey)}
                className="h-12 rounded-xl border border-amber-400/50 px-4 text-sm font-bold text-amber-300"
              >
                Report anyway
              </button>
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-base font-extrabold tracking-wide text-white transition hover:bg-violet-500 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </>
  );
}
