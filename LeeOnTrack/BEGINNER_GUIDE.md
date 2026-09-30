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

## 2. Update the "Championship Standings" table

In the same `#race-night` section, find the second card. It shows the championship positions in a table, one row per driver:

```html
<div class="card race-night__card race-night__card--standings">
  <h3>Sports Cars Championship — 2026 S1</h3>
  <p class="race-night__meta">Championship Standings</p>
  <div class="standings">
    <table class="standings__table standings__table--champ">
      ...
      <tbody>
        <tr>
          <td class="standings__cell--pos"><span class="race-night__pos race-night__pos--p1">1</span></td>
          <td><span class="standings__driver"><span class="standings__dot" style="--dot:#f5b942"></span>Naven C</span></td>
          <td class="standings__cell--num standings__points">36</td>
          <td class="standings__cell--num">1</td>
        </tr>
        ...
      </tbody>
    </table>
  </div>
</div>
```

Each driver is one `<tr>...</tr>` row. The columns, in order, are:

- **Position chip** — the number inside `<span class="race-night__pos ...">`. Keep `race-night__pos--p1`, `--p2` and `--p3` on the top 3 rows for the gold, silver and bronze chips.
- **Driver name** — the text after `standings__dot` span, e.g. `Naven C`
- **Points** — the cell with `standings__points`
- **Wins** — the last cell in the row

To update a driver, only change the numbers and the name between the `>` and `<` tags. To add or remove a driver, copy or delete a whole `<tr>...</tr>` block.

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
| Championship standings | `#race-night` second card — one `<tr>` row per driver |

---

## Safety tips

- **Make a copy** of `index.html` before editing, just in case.
- Only change the text inside the `>` and `<` tags, not the tags themselves.
- Keep the same number of opening and closing tags.
- Do not paste text copied from Word or email directly into the file — type it or paste as plain text to avoid hidden characters.

That is all you need to do to keep the race times and results up to date.
