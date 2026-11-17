---
name: CivicFix
description: Delhi NCR civic issues as a live departures board of segmented tickets.
colors:
  ground: "#17120f"
  panel: "#221b16"
  raised: "#2b231d"
  line: "#42362c"
  line-strong: "#5c4b3d"
  paper: "#f4ead8"
  dim: "#bcac95"
  faint: "#a08f78"
  marigold: "#f2a93b"
  marigold-hi: "#f7bb5c"
  marigold-lo: "#dd9425"
  changed: "#33261a"
  open: "#f07052"
  progress: "#7cb7d6"
  fixed: "#8cc07a"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  status:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.06em"
  figure:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.marigold-hi}"
  button-primary-active:
    backgroundColor: "{colors.marigold-lo}"
  button-primary-disabled:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.faint}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
    height: "48px"
  tab-category:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "40px"
  tab-category-active:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ground}"
  board-row:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.paper}"
    padding: "12px 16px"
    height: "72px"
  board-row-hover:
    backgroundColor: "{colors.panel}"
  board-row-changed:
    backgroundColor: "{colors.changed}"
  chip-changed:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "4px 4px"
  ticket:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
---

# Design System: CivicFix

## Overview

**Creative North Star: "The Ticket & Gate Board"**

CivicFix reads the neighbourhood's issues the way a station reads its departures: a ranked board on a warm near-black ground, one lead issue printed as a ticket with a punched stub, and every row split into columns by hairlines. The world is dark and warm, flat, square-cornered and dense enough to scan in sunlight on a phone held at arm's length. Nothing floats; surfaces step up in tone (ground, panel, raised) and 1px rules do the dividing.

Marigold is the board's lamp. It marks the one action on any surface, the upvote figures, and anything that has changed since this device last looked. The three status colours (vermilion, works blue, leaf green) appear only where they carry status meaning: a small square mark, the status word, a map tag's border. Type is a station-signage pairing: Barlow Semi Condensed in uppercase for labels, buttons and the wordmark; Barlow for titles and reading text; JetBrains Mono tabular figures for counts, codes and coordinates.

Motion is functional. Rows keep their identity when the board re-sorts and glide to their new rank; state changes fade colour over 150ms; reduced motion collapses all of it.

**Key Characteristics:**
- Warm near-black ground with tonal panels; no gradients on surfaces, no translucent buttons.
- Zero radius everywhere; 1px hairlines divide segments, columns and rows.
- One tear device: a dashed perforation with 12px punched notches between a ticket and its stub.
- Marigold is the single action colour and the change signal.
- Uppercase condensed labels, mixed-case Barlow reading text, mono tabular figures.
- Ranked board rows that re-rank in place (FLIP) and stay lit until a changed issue is opened.

## Colors

A warm, low-key board palette: brown-black tones, paper-cream text, one marigold lamp, and three status inks.

### Primary
- **Board Marigold** (marigold): the only action colour (primary buttons, the Report plate, the active category tab, focus outline, text selection, caret) and the change signal (the NOW chip, the progress track's completed steps, upvote figures). Its lighter step (marigold-hi) is the hover state and its deeper step (marigold-lo) is press and the active Report tab.

### Status inks
- **Vermilion Open** (open): Open status mark and word, Open map tags, error headings.
- **Works Blue** (progress): In Progress status mark and word, In Progress map tags.
- **Leaf Green** (fixed): Resolved status, the Fixed tally figure, the resolved notice border, Resolved map tags.

### Neutral
- **Station Black** (ground): page background, row background, button text on marigold, notch fill of the perforation.
- **Ticket Brown** (panel): ticket bodies, fields, popups, hover state of rows and selected tally segments.
- **Raised Brown** (raised): hover on secondary buttons and changed rows, disabled primary button, skeleton blocks.
- **Hairline** (line): default 1px dividers between rows, columns and segments.
- **Strong Hairline** (line-strong): ticket outlines, button and field borders, the perforation, dashed placeholders.
- **Changed Amber-Brown** (changed): solid fill of a board row whose status moved since you last opened it; also the pressed "Upvoted" button.
- **Paper** (paper): primary text and titles; the selected sort segment's fill.
- **Dim** (dim): labels, secondary text, codes.
- **Faint** (faint): meta lines, placeholders, inactive nav, disabled text (holds about 5:1 on ground and panel).

### Named Rules
**The One Lamp Rule.** Marigold means "act here" or "this moved". It is never decoration, never a background wash, and never a second meaning.

**The Status Ink Rule.** Vermilion, works blue and leaf green appear only where a status is being stated. They do not decorate headings, icons or chrome.

**The Lit Row Rule.** A changed issue is shown by a solid tinted row (changed) plus a marigold "NOW <STATUS>" chip in the status column, held until the issue is opened. It is never a coloured side bar.

## Typography

**Display Font:** Barlow Semi Condensed (with sans-serif)
**Body Font:** Barlow (with sans-serif)
**Label/Mono Font:** JetBrains Mono, for figures only

**Character:** Station signage. The condensed face shouts in uppercase at small sizes the way gate boards do; Barlow keeps issue titles and descriptions readable in mixed case; mono figures line up in columns.

### Hierarchy
- **Display** (700, 2.5rem, line-height 1, uppercase): the CIVICFIX wordmark on the board only.
- **Headline** (700, 1.75rem, line-height 1, uppercase): page titles on map and report; section heads drop to 1rem bold uppercase.
- **Title** (Barlow 600, 1.25rem on the lead ticket, 1.5rem on the issue pass, tight leading): issue titles.
- **Body** (Barlow 400 to 500, 15px rows and comments, 16px descriptions at relaxed leading capped at 65ch): reading text.
- **Label** (600, 0.75rem, 0.12em tracking, uppercase, dim): column heads, segment labels, field labels, meta.
- **Status** (700, 13px, 0.06em tracking, uppercase): the status word beside its square mark; category tabs and sort segments use the same family at 600.
- **Figure** (JetBrains Mono 700, tabular, -0.02em): upvotes at 1.375rem in rows, 1.75rem in the tally, 2.5 to 2.75rem on stubs; codes (CF-0001) and coordinates at 12 to 13px.

### Named Rules
**The Figures-Only Mono Rule.** JetBrains Mono sets numbers, ticket codes and coordinates, and nothing else. It is never used as costume for words.

**The Uppercase Is Condensed Rule.** Anything set in uppercase uses Barlow Semi Condensed with positive tracking; Barlow body text stays mixed case.

## Layout

A single phone column (max 512px, centred, with 1px side hairlines from 640px up) over the ground, with a fixed 64px bottom plank. Gutters are 16px. The board is a three-column grid shared by its header and every row: upvotes 3rem, issue flexible, status 6rem at phone width; 3.5rem / flexible / 7.5rem from 640px. Rows are at least 72px tall with 12px vertical padding.

The first viewport stacks a sticky wordmark bar, a three-segment tally strip (Open / In Progress / Fixed, split by hairlines, doubling as status filters), a horizontally scrolling row of square category tabs, a count line with a segmented sort control, the lead ticket, then the board header and ranked rows.

Ticket segments split by vertical hairlines. The home lead ticket shows two segments (Status | Reported) below 640px and three (Status | Reported | Comments) from 640px up, because the 92px stub takes the room at phone width. The issue pass always shows three. Rhythm runs in 6, 8, 12, 16, 20 and 24px steps.

## Elevation & Depth

Flat. Depth on the board comes from tonal stepping (ground, panel, raised) and from 1px hairlines; tickets, rows, fields and buttons cast no shadows. Inset 2px marigold rules mark active selection (top edge of the active nav tab, bottom edge of the selected tally segment), and a 1px inset marigold ring doubles the field border on focus. The only cast shadows belong to things that sit on the map: a soft drop shadow under pins and a dark ambient shadow under the popup, so they read above the warmed tiles.

### Shadow Vocabulary
- **Map popup** (`box-shadow: 0 8px 24px rgb(0 0 0 / 0.45)`): Leaflet popups only.
- **Map pin** (`filter: drop-shadow(0 2px 3px rgba(0,0,0,.55))`): square status tags only.

### Named Rules
**The Flat Board Rule.** Nothing on the board floats. If a surface needs separation, step its tone or draw a hairline.

## Shapes

Zero radius everywhere: buttons, fields, tabs, chips, status marks, tickets, popups, map controls and pins. Status marks are 8px squares. Map pins are square status tags (ground fill, 2px status-colour border, category icon inside) with a triangular pointer, sized on a fixed upvote ramp: 26px from 0, 32px from 10 and 40px from 25 upvotes.

The ticket's tear is the one cut-out shape: a 2px dashed strong-hairline perforation with 12px square notches punched at both ends, filled with ground so the ticket looks bitten. It runs vertically between the lead ticket and its upvote stub, and horizontally between the issue pass and its upvote stub. Separately, a 1px dashed border marks empty or droppable placeholders (photo picker, no-comments box); that is an affordance, not a tear.

Icons are hand-drawn line SVGs with square caps and mitred joins.

### Named Rules
**The One Tear Rule.** The punched perforation appears only where a ticket meets its stub. Do not use it as a section divider.

## Components

### Buttons
Heavy, flat plates.
- **Shape:** square (0px), at least 48px tall; the upvote button on the issue pass is 56px.
- **Primary:** marigold plate with ground text in 15px bold condensed uppercase at 0.08em tracking, 20px side padding.
- **Hover / Focus:** hover lightens to marigold-hi, press deepens to marigold-lo, colour transitions at 150ms ease-out; focus is a 2px marigold outline offset 2px.
- **Secondary:** ground fill with a strong-hairline border and paper text; hover steps to raised with a dim border.
- **Disabled:** primary drops to raised with faint text; no opacity tricks.
- **Toggled (Upvoted):** changed fill, marigold border and marigold text.

### Chips
- **Status badge:** 8px square mark in the status ink plus the status word in that ink; nowrap on board rows.
- **Category badge:** line icon plus dim uppercase category name.
- **NOW chip:** solid marigold, ground text, 11px bold condensed uppercase, "NOW <STATUS>", replacing the status badge on a changed row.

### Tabs and segmented controls
- **Category tabs:** 40px square tabs with a strong-hairline border; selected is a solid marigold plate.
- **Sort:** segments inside one strong-hairline frame; selected segment is solid paper with ground text.
- **Tally strip:** three hairline-split segments with a label, a status square and a large mono count; selected gets panel fill and a 2px inset marigold bottom rule.

### Cards / Containers (tickets)
- **Corner Style:** square (0px).
- **Background:** panel, outlined by a 1px strong hairline; hover lifts the outline to dim.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Internal Padding:** 16px sides; a header strip (category left, CF code or NOW chip right) above the title, then hairline-split label/value segments.

### Inputs / Fields
- **Style:** panel fill, 1px strong-hairline border, square, 48px min height, 16px text, faint placeholder.
- **Focus:** border and a 1px inset ring both go marigold; no glow.
- **Joined actions:** a submit button sits flush against its field, overlapping the border by 1px.

### Navigation
- **Bottom plank:** fixed, ground fill, top hairline, 64px. Board and Map are icon-over-label tabs in 12px bold condensed uppercase; inactive faint, active paper with a 2px inset marigold top rule. Report sits in the wider centre column as a marigold primary plate (marigold-lo when active).
- **Page header:** sticky ground bar with a bottom hairline; the board uses the display wordmark with a mono active count beside it.

### Board Row (signature)
The three-column ranked row: marigold mono upvote figure, title (up to three lines) over a faint category and age line, status badge right-aligned. Ground at rest, panel on hover. A changed row is filled solid with changed and carries the NOW chip until opened. Rows re-rank in place with a FLIP glide (420ms, cubic-bezier(0.16, 1, 0.3, 1)), skipped under reduced motion.

### Lead Ticket and Issue Pass (signature)
The lead ticket is the top-ranked issue printed as a ticket, with an optional photo, header strip, title and segments on the left, a vertical perforation, and a 92px stub holding a 2.5rem marigold upvote figure over an UPVOTES label. The issue pass repeats the ticket at full width with a horizontal perforation above a stub that pairs the large figure with the upvote button. The pass's location links to its own pin on the map.

### Progress Track
Three equal steps, each a 6px bar (marigold when done, line otherwise) over a condensed uppercase step name; the current step's caption is marigold.

### Map
Light OSM tiles inverted, hue-rotated and warmed with sepia to sit on the board. Pins are square status tags on the fixed upvote ramp; the heat layer runs from deep rust through vermilion and marigold to cream. Controls and popups are square, panel-filled, strong-hairline bordered.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0px), including pins, popups and map controls.
- **Do** divide with 1px hairlines (line, or line-strong for outlines) and step tone (ground, panel, raised) for separation.
- **Do** spend marigold only on the surface's action and on change: one primary plate per view plus the NOW chip and upvote figures.
- **Do** pair every status ink with its 8px square mark and the status word, never colour alone.
- **Do** set counts, CF codes and coordinates in JetBrains Mono tabular figures, and labels in Barlow Semi Condensed uppercase.
- **Do** show a changed issue as a solid changed row plus a NOW <STATUS> chip, held until opened.
- **Do** honour reduced motion: the FLIP re-rank and all transitions collapse.

### Don't:
- **Don't** round anything or use soft rounded cards.
- **Don't** use translucent or ghost buttons; buttons are solid plates or hairline-bordered ground.
- **Don't** mark change or status with a coloured side stripe wider than 1px.
- **Don't** use the punched perforation anywhere except where a ticket meets its stub.
- **Don't** cast shadows on board surfaces; shadows belong only to map pins and map popups.
- **Don't** use status inks for decoration, or marigold as a background wash.
- **Don't** set words in mono for flavour.
