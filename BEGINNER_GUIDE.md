# Beginner's Guide: Updating LeeOnTrack Race Times & Results

This guide shows you how to update the race times, race night details, and last race results on the LeeOnTrack website. No coding knowledge is required — you only need to edit text inside one file.

## The file you need

Open the file called **`index.html`** in the main project folder. All the race information lives in this file.

> **Tip:** Use a simple text editor like Notepad, Notepad++, or VS Code. Avoid Word or Google Docs, because they can add hidden formatting.

---

## 1. Update the "Next Race" date and time

The next race is shown in **three places** inside `index.html`. Update all three so they match.

### A. Header message (mobile view)

Find this text near the top of the file (around line 25):

```html
<p class="next-race-message">
  <span class="next-race-message__label">Next Race:</span>
  <span class="next-race-message__date">Sunday 13th September 2026, 19:00 UK</span>
</p>
```

Change the date/time text inside this span:

```html
<span class="next-race-message__date">Sunday 13th September 2026, 19:00 UK</span>
```

### B. Desktop banner

Find this text a little further down (around line 60):

```html
<section class="next-race-banner next-race-banner--desktop" aria-label="Next race">
  <div class="container">
    <p class="next-race-banner__text">
      <span class="next-race-banner__label">Next Race:</span>
      <span class="next-race-banner__date">Sunday 13th September 2026, 19:00 UK</span>
    </p>
  </div>
</section>
```

Change the date/time text inside this span:

```html
<span class="next-race-banner__date">Sunday 13th September 2026, 19:00 UK</span>
```

> **Important:** Make sure the time here matches the "Next Race" card in the Race Night section below.

### C. Race Night "Next Race" card

Find the section with `id="race-night"` (around line 276). Inside it, look for the first card:

```html
<div class="card race-night__card">
  <h3>Next Race</h3>
  <dl class="race-night__details">
    <dt>Day</dt>
    <dd>Sunday</dd>
    <dt>Date</dt>
    <dd>13th September 2026</dd>
    <dt>Time</dt>
    <dd>19:00 UK</dd>
    <dt>Track</dt>
    <dd>TBC</dd>
  </dl>
</div>
```

Edit the text between the `<dd>` and `</dd>` tags:

- **Day** — e.g. `Sunday`
- **Date** — e.g. `13th September 2026`
- **Time** — e.g. `19:00 UK`
- **Track** — e.g. `Silverstone` or `TBC`

Only change the text; do not remove the `<dd>` tags.

---

## 2. Update the "Last Race Result" top 3 positions

In the same `#race-night` section, find the second card:

```html
<div class="card race-night__card">
  <h3>Last Race Result</h3>
  <dl class="race-night__details">
    <dt>Date</dt>
    <dd>Race Date</dd>
    <dt>Track</dt>
    <dd>Track Name</dd>
    <dt>Winner</dt>
    <dd>Driver Name — 00:00.000</dd>
    <dt>Second</dt>
    <dd>Driver Name — 00:00.000</dd>
    <dt>Third</dt>
    <dd>Driver Name — 00:00.000</dd>
  </dl>
</div>
```

Edit the text between the `<dd>` tags:

- **Date** — the date the race happened, e.g. `6th September 2026`
- **Track** — the track name, e.g. `Oran Park`
- **Winner** — e.g. `Lee Heard — 01:23.456`
- **Second** — e.g. `Naven Chettiar — 01:23.789`
- **Third** — e.g. `Driver Name — 01:24.012`

The `—` dash and lap time are optional, but keep the same format for consistency.

---

## 3. Check your changes

1. Save `index.html`.
2. Open `index.html` in your web browser by double-clicking it.
3. Scroll down to the **Race Night** section and check the cards look correct.
4. Resize the browser window to make sure the header and banner also show the correct next race.

---

## Quick reference: where to edit

| What you want to change | Where in `index.html` |
|---|---|
| Next race (mobile header) | `<span class="next-race-message__date">` |
| Next race (desktop banner) | `<span class="next-race-banner__date">` |
| Next race (Race Night card) | `#race-night` first card `<dd>` values |
| Last race top 3 | `#race-night` second card `<dd>` values |

---

## Safety tips

- **Make a copy** of `index.html` before editing, just in case.
- Only change the text inside the `>` and `<` tags, not the tags themselves.
- Keep the same number of opening and closing tags.
- Do not paste text copied from Word or email directly into the file — type it or paste as plain text to avoid hidden characters.

That is all you need to do to keep the race times and results up to date.
