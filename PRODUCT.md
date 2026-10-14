# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first web app (single column, max-width ~512px, bottom navigation). Primary device is a phone browser; desktop shows the same phone-width column.

## Users

- **Primary: Delhi NCR residents** who spot a civic problem (pothole, garbage, broken streetlight, water leakage, sewage, traffic) while out on the street and want to report it from their phone in under a minute, then check back on whether anything happened.
- **Secondary: project examiners and evaluators.** CivicFix is a final-year project, judged through a live demo on a phone and laptop. Every core flow has to demo cleanly, but design decisions put the citizen first.

## Product Purpose

CivicFix lets citizens report local civic issues with a photo and GPS location, browse and upvote what others have reported, see where problems cluster on a map, and track each issue's status. Success means a resident can report fast, see that the community agrees with them, and see progress being made.

## Positioning

Three mechanisms define CivicFix and must stay prominent:

1. **Low-friction reporting.** Camera photo, high-accuracy GPS auto-detect with a map-pin fallback, a short form, and the report is filed from the street.
2. **Community prioritisation.** Upvotes (one per device) and a heatmap weighted by upvotes show which problems matter most, and where.
3. **Transparent status.** Every issue moves visibly through Open → In Progress → Resolved, with a timeline on its detail page.

Duplicate detection (same category within 100 m, offering "Upvote existing instead") supports both reporting and prioritisation. It is a capability, not a headline.

## Operating Context

- Used outdoors on a phone, often one-handed, with variable connectivity and bright light.
- Geolocation needs HTTPS or localhost. Phone demos go through an ngrok tunnel; on plain-HTTP LAN access the app falls back to tapping a location on the map.
- Demos run on a laptop via `npm run dev`. Data resets with `git checkout data/issues.json` and clearing `public/uploads/`.

## Capabilities and Constraints

- **Stack:** Next.js 16 App Router (TypeScript), React 19, Tailwind CSS v4, Leaflet/react-leaflet with OpenStreetMap tiles, and `leaflet.heat`.
- **Surfaces:** Home feed `/` (status summary, category chips, status filter, sort by Newest/Top), Map `/map` (status-coloured markers, heatmap, or both), Report `/report`, Issue detail `/issue/[id]` (photo, mini-map, status timeline, upvote, comments, share, admin demo control).
- **Terminology:** categories are Pothole, Garbage, Streetlight, Water Leakage, Sewage, Traffic and Other. Statuses are Open, In Progress and Resolved. Resolved issues are kept on file but hidden from the feed, map and duplicate check.
- **Current prototype scope:** no login, no database (JSON file plus local uploads), no AI, no government integration. Storage needs a writable filesystem, so the app does not run on Vercel or other serverless hosts. Status changes come only from the "Admin demo control".
- **Undecided:** whether future work adds login, authority-side tooling, AI categorisation or a real backend. Do not design UI implying these exist until that is decided.

## Brand Commitments

- Name: **CivicFix**. Geographic scope: **Delhi NCR**.
- **English only.** No Hindi or regional-language support is planned.

## Evidence on Hand

- `data/issues.json`: realistic seeded issues set at real Delhi locations (e.g. Inner Circle, Connaught Place), plus a few junk test entries created during development that should be removed before demos.
- No real user testimonials, usage numbers, partner authorities or resolution statistics exist. Never fabricate them.
- No logo or brand assets beyond the default favicon.

## Product Principles

1. **Street-speed first.** Every step of reporting is judged by whether someone standing next to a pothole can finish it quickly with one hand.
2. **Show collective weight.** Make it obvious when many people care about the same problem; steer people to agree with an existing issue rather than file a duplicate.
3. **Status is a promise.** Make progress visible and honest. Never imply that an authority is acting when the status says otherwise.
4. **Truthful about the prototype.** Never suggest government integration, accounts or official response that doesn't exist.
5. **Demo-proof.** Empty, loading, error and location-denied states must hold up in front of an examiner.

## Accessibility & Inclusion

No formal standard has been confirmed. The outdoor phone context means the app needs legible contrast in daylight and comfortable touch targets.
