"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryIcon from "@/components/CategoryIcon";
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

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Takes less than a minute" />

      <form onSubmit={onSubmit} className="space-y-6 px-4 pt-5" noValidate>
        {/* Photo */}
        <section>
          <p className="label mb-2">Photo</p>
          {preview ? (
            <div className="border border-line-strong bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={preview} alt="Selected photo preview" className="max-h-72 w-full object-cover" />
              <div className="grid grid-cols-[1fr_auto] border-t border-line">
                <button type="button" onClick={() => fileInput.current?.click()} className="btn text-paper hover:bg-raised">
                  Retake
                </button>
                <button type="button" onClick={clearPhoto} className="btn border-l border-line text-open hover:bg-raised">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-36 w-full flex-col items-center justify-center gap-1.5 border border-dashed border-line-strong bg-panel text-paper transition-colors hover:border-marigold"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-marigold" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="miter" aria-hidden>
                <path d="M3 8h4l2-3h6l2 3h4v12H3V8Z" />
                <circle cx="12" cy="13.5" r="3.5" />
              </svg>
              <span className="font-cond text-base font-bold uppercase tracking-[0.06em]">Take or choose a photo</span>
              <span className="text-sm text-faint">Optional, but it helps a lot</span>
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
          <label htmlFor="title" className="label mb-2 block">
            Title
            <Req />
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Deep pothole near the bus stop"
            className="field"
          />
        </section>

        {/* Category */}
        <fieldset>
          <legend className="label mb-2">
            Category
            <Req />
          </legend>
          <div className="grid grid-cols-4 border-l border-t border-line-strong">
            {CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={on}
                  className={`flex min-h-18 flex-col items-center justify-center gap-1.5 border-b border-r border-line-strong px-1 py-2 ${c === "Other" ? "col-span-2" : ""} text-center font-cond text-[13px] font-semibold uppercase leading-tight tracking-[0.04em] transition-colors ${
                    on ? "bg-marigold text-ground" : "bg-panel text-paper hover:bg-raised"
                  }`}
                >
                  <CategoryIcon category={c} className="h-5 w-5" />
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Description */}
        <section>
          <label htmlFor="description" className="label mb-2 block">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What's the problem? Any landmark nearby?"
            className="field resize-none"
          />
        </section>

        {/* Location */}
        <section className="border border-line-strong bg-panel">
          <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3.5">
            <div className="min-w-0">
              <p className="label">
                Location
                <Req />
              </p>
              <p className="mt-1.5 text-[15px] text-paper">
                {loc.kind === "locating" && "Detecting your location…"}
                {loc.kind === "gps" && `Using your current location (±${Math.round(loc.accuracy)} m)`}
                {loc.kind === "manual" && "Pinned on the map"}
                {loc.kind === "error" && (location ? "Pinned on the map" : `${loc.message} Tap the map to pick a spot.`)}
              </p>
              {location && (
                <p className="figure mt-1 text-[13px] text-marigold">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>
            {loc.kind === "locating" ? (
              <span className="mt-1 h-4 w-4 shrink-0 animate-spin border-2 border-line-strong border-t-marigold" aria-hidden />
            ) : (
              <span className={`mt-1 h-3 w-3 shrink-0 ${location ? "bg-fixed" : "bg-open"}`} aria-hidden />
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-line">
            <button
              type="button"
              onClick={locate}
              disabled={loc.kind === "locating"}
              className="btn gap-1.5 px-2 text-sm text-paper hover:bg-raised disabled:text-faint"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Use my location
            </button>
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              aria-expanded={showPicker}
              className="btn border-l border-line px-2 text-sm text-paper hover:bg-raised"
            >
              {showPicker ? "Hide map" : "Pick on map"}
            </button>
          </div>

          {showPicker && (
            <div className="border-t border-line">
              <div className="h-60">
                <LocationPicker value={location} onChange={pickOnMap} />
              </div>
              <p className="border-t border-line px-4 py-2 text-[13px] text-faint">Tap the map to place the pin, or drag it to adjust.</p>
            </div>
          )}
        </section>

        {/* Duplicate banner */}
        {showDuplicates && (
          <section className="border border-marigold bg-changed" role="alert">
            <p className="flex items-center gap-2 px-4 pt-3.5 font-cond text-lg font-bold uppercase leading-tight tracking-[0.03em] text-marigold">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="miter" aria-hidden>
                <path d="M12 3 2 20h20L12 3Z" />
                <path d="M12 10v4M12 17v.5" />
              </svg>
              {nearby.length} similar issue{nearby.length === 1 ? "" : "s"} already reported nearby
            </p>
            <ul className="mt-3 border-t border-line">
              {nearby.map(({ issue, distance }) => (
                <li key={issue.id}>
                  <Link
                    href={`/issue/${issue.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-3 text-sm hover:bg-raised"
                  >
                    <span className="truncate font-medium text-paper">{issue.title}</span>
                    <span className="figure shrink-0 text-xs text-dim">
                      {Math.round(distance)} m · <span className="text-marigold">{issue.upvotes}</span> upvotes
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 p-3">
              <button
                type="button"
                onClick={() => upvoteExisting(nearby[0].issue.id)}
                disabled={upvotingId !== null}
                className="btn btn-primary flex-1 px-3 leading-tight"
              >
                {upvotingId ? "Upvoting…" : "Upvote existing instead"}
              </button>
              <button type="button" onClick={() => setDismissedKey(dupKey)} className="btn btn-secondary px-4">
                Report anyway
              </button>
            </div>
          </section>
        )}

        {error && (
          <p className="flex items-start gap-2 border border-open px-4 py-3 text-sm font-medium text-paper" role="alert">
            <span className="mt-1.5 h-2 w-2 shrink-0 bg-open" aria-hidden />
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary min-h-14 w-full text-lg">
          {submitting && <span className="h-4 w-4 animate-spin border-2 border-faint border-t-paper" aria-hidden />}
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </>
  );
}

function Req() {
  return (
    <span className="text-marigold" aria-hidden>
      {" "}
      *
    </span>
  );
}
