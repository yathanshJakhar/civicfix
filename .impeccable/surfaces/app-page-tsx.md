---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/map/page.tsx","app/report/page.tsx","app/issue/[id]/IssueDetail.tsx"]
---

# CivicFix app shell (feed, map, report, issue)

Scope: the whole citizen app, all four routes. Mode: Operate. Redesign of the prior zinc/violet look; every function and the product copy stay.

Audience and job: a Delhi NCR resident on a phone, outdoors, reporting fast, backing existing issues, and checking whether status has moved. Examiners watch the same flows in a demo.

Constraints: dark and warm (user-pinned); no translucent buttons, no soft rounded cards (user-pinned); structure may change (user-confirmed). Build is code-led (Operate, no image generation).

## Direction contract

THESIS: The neighbourhood's issues as a live departures board. Each issue is a segmented ticket, and the feed is a ranked board where a status change stays lit until you've seen it. This replaces the category default of rounded image-left cards on a grey ground with a violet accent.

OWN-WORLD: Warm near-black ground #17120f, panels #221b16, 1px hairlines #42362c, paper text #f4ead8. Marigold #f2a93b is both the action colour and the "changed" signal. Status colours are vermilion (Open), works blue (In Progress) and leaf green (Resolved). Barlow Semi Condensed uppercase labels, Barlow body text and JetBrains Mono tabular figures. Zero radius everywhere, segments split by hairlines, and a dashed perforation between a ticket and its stub.

STORY: The resident sees at a glance what's open, what's being worked on and what's fixed. They back what matters, report in under a minute, and notice when something they looked at has moved.

FIRST VIEWPORT (home, 390 wide):
- A wordmark bar: CIVICFIX, with a mono line beside it (DELHI NCR · n ACTIVE).
- A three-segment tally strip (Open / In Progress / Fixed) that filters the board.
- Square category tabs.
- A lead ticket: the top issue with segments for status, reported time and comments, and a stub with a large marigold upvote figure.
- The board header (UPVOTES / ISSUE / STATUS), then ranked rows.
- A bottom plank whose Report button is a marigold plate.

Signature interaction: rows re-rank in place (FLIP) when the sort or filter changes. A row whose status changed since you last opened it holds a tinted row (token `changed`) and a marigold NOW <STATUS> chip until you open it; no side bar. Map pins are square tags sized on a fixed upvote ramp. A ticket's location links to its own pin on the map.

FORM: Ticket & Gate Board (catalog challenger, vernacular-ephemera-boarding-pass-and-gate-board, chosen over assigned candidate 3, Painted Notice Board); seed key 0c571c1c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
