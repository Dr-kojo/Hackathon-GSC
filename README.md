# GSC Verified-to-Invoice Console (hackathon demo)

Automates M1 (pricing and readiness), M5 (compliance) and M2 (two-invoice generator) for verified GSC jobs. Lane C (payments) is deliberately out of scope. No backend, no login, no real data: sample data only.

## Run locally
**Option A (easiest, VS Code):** install the *Live Server* extension, right-click `index.html`, choose *Open with Live Server*.
**Option B:** in this folder run `python3 -m http.server 5500` then open http://localhost:5500
**Option C:** double-click `index.html` (works without a server).

## Files (who edits what)
| File | Purpose |
|---|---|
| `index.html` | Page structure, tabs, script order |
| `css/styles.css` | GSC-style theme. Colours are variables in `:root` |
| `js/data.js` | Rate cards, agents, client contracts, deductions, sample jobs |
| `js/engine.js` | **M1 + M5 logic**: `ev()` applies every check and returns Ready / Blocked / Needs review + reason code (R01 to R11) |
| `js/actions.js` | Edit handlers, CSV upload, copy-to-clipboard, `run()` |
| `js/ui.js` | `render()`: intake, M1, M5 and M2 invoice panels, Sage CSV |
| `js/main.js` | Tab switching, first render |

## Suggested split for the group
- Rules and tax: `engine.js` (add or tighten checks, each is one `K(...)` line)
- Data: `data.js` (load the real data pack, real rate card, contract rules)
- UI and branding: `styles.css`, `ui.js`
- Pitch and money map: use the live KPI strip and the leak figures from the real data

## Reason codes
R01 not verified or rejected, R02 duplicate, R03 evidence incomplete, R04 no rate-card line, R05 rate card does not match service date, R06 conflicting flags, R07 VAT agent without self-billing agreement, R08 self-employed status unreviewed, R09 deduction not allowed, R10 deduction over cap, R11 client contract does not allow billing.

## Placeholders to replace
Weekend x1.25, emergency x1.5, no-access x0.5, revisit x0.75, agent share 70%, deduction cap 25%, all prices and sample jobs. Not legal advice: check VAT, self-billing and employment status rules with the team's M5 research.
