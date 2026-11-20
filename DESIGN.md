---
name: CivicFix
description: Delhi NCR civic issues printed as bus tickets on a manila desk.
colors:
  desk: "#ddcca6"
  ground: "#eee3ca"
  panel: "#fdfaf1"
  raised: "#f2e9d5"
  stub: "#f8e1d8"
  line: "#d3c4a2"
  line-strong: "#a08a62"
  ink: "#2b2118"
  dim: "#574837"
  faint: "#5f4f3a"
  marigold: "#e8922c"
  marigold-hi: "#f0a447"
  marigold-lo: "#d27f1c"
  saffron: "#8a4205"
  changed: "#f8e2b4"
  open: "#9c2714"
  progress: "#265482"
  fixed: "#2f5c23"
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
    fontWeight: 500
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
  stamp:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.1em"
  button:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  figure:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  none: "0px"
  hole: "50%"
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
    textColor: "{colors.ink}"
    typography: "{typography.button}"
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
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-upvoted:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.saffron}"
    rounded: "{rounded.none}"
    height: "56px"
  field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
    height: "48px"
  tab-category:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "40px"
  tab-category-active:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
  sort-segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    height: "36px"
  board-row:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
    height: "72px"
  board-row-hover:
    backgroundColor: "{colors.raised}"
  board-row-changed:
    backgroundColor: "{colors.changed}"
  chip-changed:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 4px"
  ticket:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  stub:
    backgroundColor: "{colors.stub}"
    textColor: "{colors.saffron}"
    rounded: "{rounded.none}"
    width: "92px"
  punch:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.hole}"
    size: "14px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
---

# Design System: CivicFix

## Overview

**Creative North Star: "The Ticket Counter"**

CivicFix lays the neighbourhood's issues out on a manila desk the way a Delhi bus conductor's float lays out ticket stock. The page is a sheet of manila card with a fine brown grain and faint fibres running along it; the top issue sits on it as a slip of cream ticket stock with a soft contact shadow, and its pink counterfoil is torn off behind a dotted perforation with round notches bitten out of each edge. Everything else (the tally strip, the tabs, the ranked board rows) is printed directly on the manila in carbon ink and divided by ruled lines.

Colour comes from the inks and plates of that counter. Saffron is the action plate: a solid marigold block with ink text for the one thing to do, and a deep saffron for printed figures, links and the bits of type that say "this is live". Status is a rubber stamp in stamp-pad ink, red for Open, blue for In Progress, green for Resolved, slightly tilted, double-ruled and unevenly inked. A row whose status moved since this phone last looked is run over with a highlighter until it is opened. Backing an issue punches a clean round conductor's hole through its counterfoil.

The world is light, warm and legible in direct sunlight: carbon ink on cream holds high contrast, grain stays low-alpha, and every corner is square. The only round shapes are holes in the paper: punch holes and perforation notches. Motion belongs to the paper too: a stamp comes down when an admin changes status, a punch pops in when you upvote, and board rows glide to their new rank; reduced motion collapses all of it.

**Key Characteristics:**
- Manila ground with SVG grain and fibre; cream ticket stock with grain; pink counterfoil stub.
- Square corners everywhere; round only for punch holes and perforation notches.
- One soft brown contact shadow lifts ticket slips off the manila; rows and chrome are printed flat.
- Saffron in two weights: marigold plates for action, deep saffron for printed figures and links.
- Status as a tilted, double-ruled rubber stamp on tickets and as a square mark plus word on rows.
- Barlow Semi Condensed uppercase for labels and plates, Barlow for reading, JetBrains Mono for figures only.

## Colors

A warm paper palette: manila and cream stock, carbon-brown ink, saffron plates and three stamp-pad inks.

### Primary
- **Marigold Plate** (marigold): the action plate. Primary buttons, the Report plate in the bottom bar, the selected category tab, the selected map layer, the NOW chip, the completed bars of the progress track, and the inset rule marking the selected tally segment and active nav tab. Text on it is always ink. Its lighter step **Marigold Hi** (marigold-hi) is hover; its deeper step **Marigold Lo** (marigold-lo) is press, the active Report plate and the 1px edge of every plate.
- **Deep Saffron** (saffron): saffron as printed matter. Upvote figures, the active count, links and Share, AI-classified headings, timeline ticks and the current step caption, the upload icon, the caret and the 2px focus outline. It is the only saffron dark enough to carry text on paper.

### Tertiary (stamp-pad inks)
- **Stamp Red** (open): Open status (stamp, word, 8px mark, map tag border); also error headings, the error notice border and the remove-photo action.
- **Stamp Blue** (progress): In Progress status.
- **Stamp Green** (fixed): Resolved status, the Fixed tally figure, the resolved notice border, the located-pin dot on the report form.

### Neutral
- **Desk** (desk): the table beyond the 512px phone column, visible on wider screens only.
- **Manila** (ground): the sheet every screen is printed on: page column, sticky bars, bottom plank, board rows at rest, perforation notches and punch holes.
- **Ticket Stock** (panel): ticket slips, fields, tabs, secondary buttons, popups, map controls and pin faces.
- **Pressed Stock** (raised): hover on rows, tabs and secondary buttons; disabled primary plate; skeleton blocks.
- **Counterfoil Pink** (stub): the torn-off upvote stub of a ticket, and nothing else.
- **Rule** (line): 1px dividers inside tickets and between board rows.
- **Strong Rule** (line-strong): ticket, button, tab and field outlines; bar edges; the dotted perforation; dashed placeholders; scrollbar thumb.
- **Carbon Ink** (ink): titles, body text, text on marigold plates, the selected sort segment and the toast plate.
- **Dim** (dim): labels, secondary copy, codes, descriptions.
- **Faint** (faint): meta lines, placeholders, inactive nav, disabled text. Built only marginally lighter than dim so it still reads in sunlight.
- **Highlighter** (changed): fill of a board row whose status moved since this device last opened it; text selection; the possible-duplicate notice.

### Named Rules
**The Two Saffrons Rule.** Marigold is a plate and always carries ink text; deep saffron is ink and always sits on paper. Never set saffron text on a marigold plate, and never set body copy in marigold.

**The Stamp Ink Rule.** Red, blue and green state status, or (red and green only) an error or confirmed state. They never decorate headings, icons or chrome, and status is never colour alone: a word or stamp always comes with it.

**The Highlighter Rule.** A changed issue is shown by a highlighter-filled row plus a marigold "NOW <STATUS>" chip, held until the issue is opened. It is never a coloured side bar.

## Typography

**Display Font:** Barlow Semi Condensed (with sans-serif), weights 500 to 700
**Body Font:** Barlow (with sans-serif), weights 400 to 600
**Label/Mono Font:** JetBrains Mono (500, 700), for figures only

**Character:** Ticket print. The condensed face is the printed heading of a ticket and the lettering on a rubber stamp; Barlow keeps titles and descriptions readable in mixed case; mono figures line up in columns like a ticket machine's numbers.

### Hierarchy
- **Display** (700, 2.5rem, line-height 1, uppercase): the CIVICFIX wordmark on the board only.
- **Headline** (700, 1.75rem, line-height 1, uppercase): page titles (map title drops to 1.5rem); empty and error titles at 1.125 to 1.25rem; section heads at 1rem bold uppercase.
- **Title** (Barlow 600, 1.25rem on the lead ticket, 1.5rem on the issue pass, tight leading): issue titles.
- **Body** (Barlow 500, 15px for row titles, comments and segment values; 16px at relaxed leading for descriptions, capped at 65ch; 13 to 14px for meta and notices).
- **Label** (600, 0.75rem, 0.12em tracking, uppercase, dim): column heads, segment labels, field labels, comment meta.
- **Status** (700, 13px, 0.06em tracking, uppercase): the status word beside its square mark on rows; category tabs, sort segments and category badges use the same family at 600.
- **Stamp** (700, 0.9375rem, 0.1em tracking, uppercase): the rubber-stamp status on tickets.
- **Button** (700, 0.9375rem, 0.08em tracking, uppercase): every plate; the large upvote and submit plates step up to 1.125rem.
- **Figure** (JetBrains Mono 700, tabular, -0.02em): upvotes at 1.375rem in rows, 1.75rem in the tally, 2.5rem on the lead stub and 2.75rem on the pass stub; CF codes at 13px, coordinates at 12px.

### Named Rules
**The Figures-Only Mono Rule.** JetBrains Mono sets numbers, ticket codes and coordinates, and nothing else. It is never costume for words.

**The Uppercase Is Condensed Rule.** Anything set in uppercase uses Barlow Semi Condensed with positive tracking; Barlow reading text stays mixed case.

## Layout

A single phone column (max 512px, centred) printed on manila. From 640px up the column gains strong-rule side edges and a soft shadow so it sits on the darker desk. A fixed 64px bottom plank (plus safe area) carries Board, Report and Map in a 1 : 1.3 : 1 grid. Gutters are 16px; ticket slips sit inset by 16px on the manila.

The board is a three-column grid shared by its header and every row: upvotes 3rem, issue flexible, status 6rem at phone width; 3.5rem / flexible / 7.5rem from 640px. Rows are at least 72px tall with 12px vertical padding. The home view stacks the sticky wordmark bar, a three-segment tally strip (Open and In Progress filter the board, Fixed is a count), a horizontally scrolling row of square category tabs with no visible scrollbar, a count line with a two-segment sort, the lead ticket, then the board header and ranked rows.

Ticket segments are split by vertical rules. The lead ticket shows two segments (Status | Reported) below 640px and three from 640px up, because its 92px stub takes the room at phone width; the issue pass always shows three. Rhythm runs in 6, 8, 12, 16, 20 and 24px steps.

## Elevation & Depth

Paper on a desk. Depth is physical and shallow: the manila sheet is flat, things printed on it are flat, and only loose slips cast a soft brown contact shadow. Holes read as holes through an inset shadow. Nothing glows; all shadows are tinted with the manila's own brown rather than black.

### Shadow Vocabulary
- **Slip** (`box-shadow: 0 1px 0 rgb(92 66 28 / 0.1), 0 3px 8px -3px rgb(92 66 28 / 0.28)`): every ticket slip, the possible-duplicate notice, map zoom controls.
- **Slip lifted** (`box-shadow: 0 1px 0 rgb(92 66 28 / 0.1), 0 6px 14px -4px rgb(92 66 28 / 0.32)`): hover on the lead ticket only.
- **Loose sheet** (`box-shadow: 0 6px 18px -4px rgb(60 40 12 / 0.4)` to `0.45`): map popups and the toast, which sit above other paper.
- **Column on desk** (`box-shadow: 0 6px 28px -10px rgb(92 66 28 / 0.45)`): the phone column from 640px up.
- **Notch** (`box-shadow: inset 0 1px 2px rgb(92 66 28 / 0.25)`): the half-circle notches at each end of a perforation.
- **Punch hole** (`box-shadow: inset 0 1.5px 2px rgb(60 40 12 / 0.45), 0 0 0 1px rgb(92 66 28 / 0.35)`): the conductor's punch.
- **Map tag** (`filter: drop-shadow(0 2px 2px rgba(60,40,12,.4))`): status pins on the map.

### Named Rules
**The Loose Slip Rule.** Only paper that lies on the manila casts a shadow: tickets, popups, the toast, map controls. Board rows, the tally strip, tabs, bars and buttons are printed on the sheet and stay flat.

## Shapes

Square corners everywhere: buttons, fields, tabs, chips, stamps, status marks, tickets, popups, map controls and pins. The only round forms are holes through paper: the 14px conductor's punch and the 16px half-circle notches at each end of a perforation, both filled with grained manila so they look cut through to the desk.

The perforation is a 3px dotted strong-rule line. It runs vertically between the lead ticket and its stub and horizontally between the issue pass and its stub. Separately, a 1px dashed strong-rule border marks empty or droppable placeholders (photo picker, no-comments box, admin demo panel); that is an affordance, not a tear.

Status marks are 8px squares (10px in the map legend). Map pins are square ticket-stock tags with a 2px stamp-ink border, the category icon inside in the same ink, and a triangular pointer, sized on a fixed upvote ramp: 26px from 0, 32px from 10 and 40px from 25 upvotes. Icons are line SVGs with square caps and mitred joins.

### Named Rules
**The Holes Are Round Rule.** A circle means a hole in the paper. Nothing else is rounded: no pills, no soft cards, no rounded buttons.

**The One Tear Rule.** The perforation appears only where a ticket meets its counterfoil stub. It is never a section divider.

## Components

### Buttons
Solid printed plates.
- **Shape:** square (0px), at least 48px tall with a 1px edge; the upvote and submit plates are 56px.
- **Primary:** marigold plate, marigold-lo edge, ink text in 15px bold condensed uppercase at 0.08em tracking, 20px side padding.
- **Hover / Focus:** hover lifts to marigold-hi, press deepens to marigold-lo; colour transitions run 150ms ease-out. Focus is a 2px deep-saffron outline offset 2px.
- **Secondary:** ticket stock with a strong-rule edge and ink text; hover steps to pressed stock with a dim edge.
- **Disabled:** primary drops to pressed stock with a rule edge and faint text; no opacity tricks.
- **Toggled (Upvoted):** ticket stock, deep-saffron edge and deep-saffron text; hover steps to pressed stock.
- **Joined actions:** a plate sits flush against its field or neighbour, overlapping the 1px edge.

### Chips
- **Status badge (rows):** 8px square mark in the stamp ink plus the status word in that ink, 13px bold condensed uppercase, nowrap.
- **Category badge:** line icon plus dim condensed uppercase category name.
- **NOW chip:** marigold plate with marigold-lo edge, ink text, 12px bold condensed uppercase, "NOW <STATUS>", replacing the status badge on a changed row or the CF code on a changed lead ticket.

### Tabs and segmented controls
- **Category tabs:** 40px square tabs on ticket stock with a strong-rule edge; selected is a marigold plate.
- **Sort:** two 36px segments inside one strong-rule frame; selected is solid carbon ink with stock-coloured text.
- **Tally strip:** three rule-split segments printed on manila, each a label with a status square over a 1.75rem mono count; selected gets ticket stock and a 3px inset marigold bottom rule.
- **Map layers and admin status:** three-way segmented bars; the map's selected layer is a marigold plate, the admin's selected status is a solid plate in its stamp ink with stock-coloured text.

### Cards / Containers (tickets)
- **Corner Style:** square (0px).
- **Background:** ticket stock with grain, 1px strong-rule outline.
- **Shadow Strategy:** the Slip shadow; the lead ticket lifts to Slip lifted on hover (see Elevation & Depth).
- **Internal Padding:** 16px sides; a header strip (category left, CF code or NOW chip right) over a rule, the title, then rule-split label/value segments.

### Inputs / Fields
- **Style:** ticket stock, 1px strong-rule edge, square, 48px min height, 16px text, faint placeholder, deep-saffron caret.
- **Focus:** edge and a 1px inset ring both go deep saffron; no glow.

### Navigation
- **Bottom plank:** fixed manila bar with a strong-rule top edge, 64px. Board and Map are icon-over-label tabs in 12px bold condensed uppercase; inactive faint, active ink with a 2px inset marigold top rule. Report sits in the wider centre column as a marigold plate (marigold-lo when active).
- **Page header:** sticky manila bar with a strong-rule bottom edge; the board uses the display wordmark with a deep-saffron mono active count beside it; the issue view uses a Back / Share bar.

### Rubber Stamp (signature)
Status on any ticket is a rubber stamp: the status word in 15px bold condensed uppercase, a 2px border with a 1px inner rule separated by a ticket-stock gap, rotated -3deg, masked with a noise texture so the ink coverage is uneven. When an admin changes status the new stamp comes down: it drops from 1.7x scale and -9deg to -3deg, overshooting to 0.94x, over 360ms on cubic-bezier(0.16, 1, 0.3, 1). The motion plays only for a change made on this screen, never on load.

### Counterfoil Stub and Punch (signature)
The lead ticket ends in a 92px pink counterfoil behind a vertical perforation, holding a 2.5rem deep-saffron upvote figure over an UPVOTES label. The issue pass repeats it below a horizontal perforation, pairing a 2.75rem figure with the 56px upvote plate. When this device has upvoted, a 14px punch hole sits in the stub's top corner; upvoting on the pass pops it in from 0.2x over 220ms.

### Board Row (signature)
The three-column ranked row printed on manila: deep-saffron mono upvote figure, title (up to three lines) over a faint category and age line, status badge right-aligned. Pressed stock on hover. A changed row takes the highlighter fill and the NOW chip until opened. Rows re-rank in place with a FLIP glide, skipped under reduced motion.

### Progress Track
Three equal steps, each a 6px bar (marigold when done, rule otherwise) over a condensed uppercase step name with a deep-saffron tick when done; the current step's caption is deep saffron.

### Map
Standard OSM tiles warmed into paper (sepia 0.38, saturate 0.78, contrast 0.94) on a manila container. Pins are square ticket-stock tags on the fixed upvote ramp; the heat layer runs from pale marigold through marigold and burnt orange to stamp red. The title card, legend and popups are ticket slips; zoom controls are square stock buttons.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0px); round only punch holes and perforation notches.
- **Do** print chrome and rows flat on manila, and lift only loose slips (tickets, popups, toast) with the brown Slip shadow.
- **Do** put ink text on marigold plates and use deep saffron for figures, links and live text on paper.
- **Do** show status on tickets as the tilted rubber stamp, and on rows as the 8px square mark plus the status word.
- **Do** set counts, CF codes and coordinates in JetBrains Mono tabular figures, and labels in Barlow Semi Condensed uppercase.
- **Do** show a changed issue as a highlighter row plus a NOW <STATUS> chip, held until opened.
- **Do** keep grain and fibre low-alpha so carbon ink stays legible in sunlight.
- **Do** honour reduced motion: the stamp, the punch, the FLIP re-rank and all transitions collapse.

### Don't:
- **Don't** round anything else or use soft rounded cards, pills or rounded buttons.
- **Don't** use translucent or ghost buttons; buttons are solid plates or rule-edged stock.
- **Don't** mark change or status with a coloured side stripe.
- **Don't** use the perforation anywhere except where a ticket meets its stub, or pink stock for anything but the stub.
- **Don't** use stamp inks for decoration, or marigold as a background wash or text colour.
- **Don't** use black or grey shadows, glows, or shadows on printed rows and bars.
- **Don't** set words in mono for flavour.
- **Don't** play the stamp or punch motion on page load; they mark a change made here.
