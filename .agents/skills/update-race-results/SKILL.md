---
name: update-race-results
description: Update Season 2 race results tables in race-info.html and championship standings in index.html when new race results (JSON format) are received.
---

# Update Race Results Skill

This skill guides the automated or manual update of race classifications, heat tables, and points inside `race-info.html` and `index.html` whenever new race results are received in JSON format.

---

## 1. Trigger Conditions
Activate this skill whenever:
- The user provides race result data (e.g. from iRacing, SimResults, or custom JSON) and asks to "update race results", "enter results for Round X", or "update standings".
- A JSON results file (such as `round1.json`) is added to the workspace.

---

## 2. Expected JSON Format

### A. Single Race (e.g., Round 1 Spa, Round 4 Sebring, Round 6 Daytona)
```json
{
  "season": 2,
  "round": 1,
  "track": "Spa Grand Prix",
  "carClass": "GT3",
  "format": "90-minute endurance",
  "results": [
    {
      "pos": 1,
      "driver": "Naven C",
      "country": "South Africa",
      "dotColor": "#f5b942",
      "carNumber": "25",
      "car": "Ferrari 296 GT3",
      "carClass": "GT3",
      "start": 1,
      "interval": "—",
      "avgLap": "2:18.450",
      "bestLap": "2:17.120",
      "bestLapNum": 14,
      "isFastestLap": true,
      "laps": 38,
      "lapsLed": 22,
      "inc": 2,
      "champPts": 25,
      "aggPts": 25
    }
  ]
}
```

### B. Double Header (e.g., Round 2 Summit Point, Round 3 Brands Hatch, Round 5 Okayama)
```json
{
  "season": 2,
  "round": 2,
  "track": "Summit Point Full",
  "carClass": "Mazda MX-5",
  "format": "Double Header",
  "races": [
    {
      "raceNumber": 1,
      "title": "Race 1 — Heat Results (15 Mins)",
      "results": [ ... ]
    },
    {
      "raceNumber": 2,
      "title": "Race 2 — Feature Results (30 Mins)",
      "results": [ ... ]
    }
  ]
}
```

---

## 3. Automation Method (Recommended)

A zero-dependency Node.js script is included with this skill to automatically validate and inject race results into `race-info.html`:

```bash
node .agents/skills/update-race-results/scripts/update_results.js <path-to-results.json>
```

### Options:
- `--round <number>`: Force target round if not specified in JSON.
- `--html <path>`: Specify path to `race-info.html` (defaults to `./race-info.html`).

---

## 4. HTML Table Structure & Styling Guide

When populating tables manually or reviewing script output, adhere to these LeeOnTrack styling standards:

1. **Podium Badges:**
   - **P1:** `<td class="standings__cell--pos"><span class="race-night__pos race-night__pos--p1">1</span></td>`
   - **P2:** `<td class="standings__cell--pos"><span class="race-night__pos race-night__pos--p2">2</span></td>`
   - **P3:** `<td class="standings__cell--pos"><span class="race-night__pos race-night__pos--p3">3</span></td>`
   - **P4+:** `<td class="standings__cell--pos"><span class="race-night__pos">4</span></td>`

2. **Driver Name Formatting & Country Tag:**
   - **Driver Name Rule:** Always format driver names with the **full first name** and **only initials for the surname and any middle names** (e.g. `Glenn Farbrother` → `Glenn F`, `Tom J Baker` → `Tom J B`, `Danial B Cook` → `Danial B C`). Strip any trailing duplicate-account digits from iRacing member exports (e.g. `Shaun Tucker2` → `Shaun T`, `Alex Mendoza2` → `Alex M`).
   ```html
   <th scope="row">
     <span class="standings__driver">
       <span class="standings__dot" style="--dot:#f5b942"></span>
       <span>Glenn F<span class="standings__sub">United Kingdom</span></span>
     </span>
   </th>
   ```

3. **Column Title Preservation:**
   - Keep existing HTML table column headers intact (`Pos`, `Driver`, `#`, `Car`, `Car Class`, `Start`, `Interval`, `Avg Lap Time`, `Best Lap`, `Laps`, `Inc`, `Champ Pts`, `Agg Pts`).
   - Only map incoming data fields that match existing column titles; do not create extra columns (such as `status`).

4. **Fastest Lap Indicator:**
   Highlight the overall fastest lap in purple:
   ```html
   <td class="standings__cell--num">
     <span><span class="standings__fl">2:17.120</span><span class="standings__sub">Lap 14</span></span>
   </td>
   ```

5. **Points:**
   Championship points must include the bold green class `.standings__points`:
   ```html
   <td class="standings__cell--num standings__points">25</td>
   ```

---

## 5. Standings Table Update (`index.html`)

If the race result includes updated championship aggregate standings:
1. Locate `<table class="standings__table standings__table--champ">` in `index.html`.
2. Update the driver rankings, points, and dot colors.
3. Keep the "Show more standings" `<details>` element functional for drivers outside the top 8.

---

## 6. Pre-Completion Next Race Verification Rule

**MANDATORY CHECK BEFORE COMPLETING:**
Whenever race results are updated for a completed round, you **MUST** ensure that all Next Race dates and spotlight information across the entire website reflect the upcoming round (normally the following Sunday):

1. **Verify Matching Next Race & Schedule Dates (`index.html`):**
   - Cross-check that the Next Race message at line 33 of `index.html`:
     ```html
     <p class="next-race-message">
       <span class="next-race-message__label">Next Race:</span>
       <span class="next-race-message__date">Sunday 25th October 2026, 19:00 UK</span>
     </p>
     ```
     strictly matches the next upcoming round listed in the Season Schedule at line 357+ (`.race-night__card--season` / `.race-round-item--next`).
2. **Synchronize the Desktop Next Race Banner:**
   - Update `<span class="next-race-banner__date">` in the hero banner on `index.html` (e.g. `SUNDAY 25th OCTOBER 2026, 19:00 UK`).
3. **Update "This Weekend's Race" Spotlight (`#this-weekend` on `index.html`):**
   - Update the spotlight card with the upcoming round's details: round number, track name, car badge, format badge, date, time, and session format (e.g., Round 2 Summit Point Full, Mazda MX-5, Double Header).
4. **Synchronize Global Header Message Across All Site Pages:**
   - Ensure `<span class="next-race-message__date">` in `<header class="site-header">` is updated to the next round's date on all pages:
     - `index.html`
     - `race-info.html`
     - `application.html`
     - `gallery.html`
     - `privacy.html`
     - `terms.html`
     - `thank-you.html`

---

## 7. Mandatory Pre-Push Audit & Quality Gate Rule

**MANDATORY AUDIT PROCEDURE BEFORE ANY `git push`:**
When all website updates (race results, standings, next race dates, spotlights, and schedules) are finished, you **MUST** execute the following three audits and create a report on any issues before `git push` occurs:

1. **Security Audit (`security-audit`):**
   - Scan dependencies for known vulnerabilities.
   - Verify no hardcoded secrets, credentials, or private API keys exist in source files.
   - Check Content-Security-Policy (CSP), iframe/script restrictions, and XSS mitigations across templates.
2. **Accessibility Audit (`accessibility-audit`):**
   - Verify semantic HTML landmark structure (`<header>`, `<main>`, `<nav>`, `<footer>`, `<table>`).
   - Audit ARIA attributes, roles, and labels (`aria-label`, `aria-expanded`, `aria-hidden`, `.sr-only` table captions).
   - Check keyboard navigation, focus indicators, and `<details>` collapsible functionality.
   - Verify compliant color contrast ratios for driver dots, badges, and table text.
3. **GDPR & Privacy Compliance Audit (`gdpr-compliance`):**
   - Audit data collection on forms (such as `application.html`) for proper consent mechanisms.
   - Verify that user privacy notices and links to `privacy.html` and `terms.html` are visible and accessible.
   - Check that personal information (driver names, emails, contact info) adheres to data minimization standards.

### Output & Enforcement:
- Generate a comprehensive **Pre-Push Quality & Compliance Audit Report** summarizing status, findings, and severity ratings across Security, Accessibility, and GDPR.
- Remediate any blocking issues before pushing changes.
- **Never perform `git push` until all three audits have run and the report is documented.**


