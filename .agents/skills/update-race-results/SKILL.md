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

2. **Driver Name & Country Tag:**
   ```html
   <th scope="row">
     <span class="standings__driver">
       <span class="standings__dot" style="--dot:#f5b942"></span>
       <span>Driver Name<span class="standings__sub">Country</span></span>
     </span>
   </th>
   ```

3. **Fastest Lap Indicator:**
   Highlight the overall fastest lap in purple:
   ```html
   <td class="standings__cell--num">
     <span><span class="standings__fl">2:17.120</span><span class="standings__sub">Lap 14</span></span>
   </td>
   ```

4. **Points:**
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
