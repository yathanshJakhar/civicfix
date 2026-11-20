---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/map/page.tsx","app/report/page.tsx","app/issue/[id]/IssueDetail.tsx"]
---

# CivicFix app shell (feed, map, report, issue)

Scope: the whole citizen app, all four routes. Mode: Operate. Re-materialisation of the departures-board world: the dark, heavy board is replaced by printed paper (user-pinned, 2026-11-17). Ticket structure, ranked board, functions and product copy all stay.

Audience and job: a Delhi NCR resident on a phone, outdoors in bright light, reporting fast, backing existing issues, checking whether status has moved. Examiners watch the same flows in a demo.

Constraints: light paper world, Delhi bus-ticket stock (user-pinned); subtle grain only, readable in sunlight (user-pinned); keep tickets, lead ticket + stub, ranked rows (user-pinned); square corners, no translucent buttons, no soft rounded cards (carried over). Code-led (Operate).

## Direction contract

THESIS: The neighbourhood's issues as printed bus tickets on a manila desk. Each issue is a slip of ticket stock with a tear-off counterfoil; status is rubber-stamped, and backing an issue punches your ticket. Refuses both the old dark gate board and the category default of white rounded cards on grey.

OWN-WORLD: Manila ground #eee3ca with fine paper grain; ticket stock #fdfaf1 with a soft contact shadow; pink counterfoil stub #f8e1d8 behind a dotted perforation with round notches. Carbon ink #2b2118 text. Saffron #e8922c action plates with ink text, deep saffron #8a4205 for figures. Stamp-pad inks: red #9c2714 Open, blue #265482 In Progress, green #2f5c23 Resolved. Highlighter #f8e2b4 marks changed rows. Barlow / Barlow Semi Condensed / JetBrains Mono figures. Square corners; round only for punch holes and perforation notches.

STORY: The resident sees at a glance what's open, being worked on, fixed; backs what matters; reports in under a minute; notices what moved.

FIRST VIEWPORT (home, 390 wide): manila wordmark bar (CIVICFIX + saffron active count); three-segment tally strip filtering the board; square category tabs; count + sort; the lead ticket on ticket stock with stamped status and a pink upvote counterfoil; board header and ranked rows printed on the manila; bottom plank with a saffron Report plate.

Signature interaction: upvoting punches a round conductor's hole in the counterfoil (pass and lead ticket); an admin status change re-stamps the status with a stamp-down motion. Rows still re-rank with FLIP; changed rows are highlighted until opened.

FORM: Ticket & Gate Board topology kept, re-materialised as Delhi bus-ticket stock (user-pinned direction, no roll; prior seed key 0c571c1c).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
