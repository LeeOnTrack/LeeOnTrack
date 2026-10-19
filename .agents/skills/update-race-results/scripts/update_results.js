#!/usr/bin/env node
/**
 * update_results.js
 * Automatically parses race result JSON and injects rows into race-info.html.
 * Usage: node update_results.js <path-to-json> [--round <number>] [--html <path>]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  node update_results.js <results.json> [options]

Options:
  --round <1-6>   Target round number (overrides JSON "round" property)
  --html <path>   Target HTML file (defaults to ./race-info.html)
  --help, -h      Show this help message
`);
  process.exit(0);
}

let jsonPath = null;
let forcedRound = null;
let htmlPath = path.resolve(process.cwd(), 'race-info.html');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--round' && args[i + 1]) {
    forcedRound = parseInt(args[++i], 10);
  } else if (args[i] === '--html' && args[i + 1]) {
    htmlPath = path.resolve(process.cwd(), args[++i]);
  } else if (!args[i].startsWith('--')) {
    jsonPath = path.resolve(process.cwd(), args[i]);
  }
}

if (!jsonPath || !fs.existsSync(jsonPath)) {
  console.error(`Error: JSON file not found at "${jsonPath}"`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error(`Error: HTML file not found at "${htmlPath}"`);
  process.exit(1);
}

const rawData = fs.readFileSync(jsonPath, 'utf8');
let raceData;
try {
  raceData = JSON.parse(rawData);
} catch (e) {
  console.error(`Error: Failed to parse JSON: ${e.message}`);
  process.exit(1);
}

const roundNum = forcedRound || raceData.round;
if (!roundNum || roundNum < 1 || roundNum > 6) {
  console.error(`Error: Invalid round number "${roundNum}". Must be between 1 and 6.`);
  process.exit(1);
}

function formatDriverName(name) {
  if (!name || name === '—') return '—';
  const cleaned = name.replace(/\d+$/, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;
  const first = parts[0];
  const initials = parts.slice(1).map(p => p[0].toUpperCase()).join(' ');
  return `${first} ${initials}`;
}

function generateRows(resultsList) {
  if (!Array.isArray(resultsList) || resultsList.length === 0) {
    return '<!-- No results data available -->';
  }

  const defaultDots = ['#f5b942', '#e0aaff', '#7aa2f7', '#f7768e', '#9ece6a', '#73daca', '#b4f9f8', '#bb9af7', '#ff9e64', '#2ac3de'];

  return resultsList.map((entry, index) => {
    const pos = entry.pos || (index + 1);
    let posClass = 'race-night__pos';
    if (pos === 1) posClass += ' race-night__pos--p1';
    else if (pos === 2) posClass += ' race-night__pos--p2';
    else if (pos === 3) posClass += ' race-night__pos--p3';

    const dot = entry.dotColor || defaultDots[(pos - 1) % defaultDots.length];
    const rawDriver = entry.driver || '—';
    const driver = formatDriverName(rawDriver);
    const country = entry.country ? `<span class="standings__sub">${entry.country}</span>` : '';
    const carNumber = entry.carNumber || entry.number || entry.car_number || '—';
    const car = entry.car || '—';
    const carClass = entry.carClass || entry.class || entry.car_class || 'Hosted All Cars';
    const start = entry.start != null ? entry.start : (entry.start_pos != null ? entry.start_pos : '—');
    const interval = (entry.interval && entry.interval !== 'LEADER') ? entry.interval : '—';
    const avgLap = entry.avgLap || entry.avg_lap || '—';

    const bestLap = entry.bestLap || entry.best_lap;
    const bestLapNum = entry.bestLapNum || entry.best_lap_num;
    let bestLapContent = bestLap || '—';
    if (bestLap && bestLap !== '—') {
      const flSpan = entry.isFastestLap ? `<span class="standings__fl">${bestLap}</span>` : bestLap;
      const lapSub = bestLapNum ? `<span class="standings__sub">Lap ${bestLapNum}</span>` : '';
      bestLapContent = `<span>${flSpan}${lapSub}</span>`;
    }

    const lapsLed = entry.lapsLed != null ? entry.lapsLed : entry.led_laps;
    let lapsContent = entry.laps != null ? `${entry.laps}L` : '—';
    if (entry.laps != null && lapsLed != null) {
      lapsContent = `<span>${entry.laps}L<span class="standings__sub">Led ${lapsLed}L</span></span>`;
    }

    const inc = entry.inc != null ? entry.inc : '—';
    const champPts = entry.champPts != null ? entry.champPts : (entry.champ_pts != null ? entry.champ_pts : '—');
    const aggPts = entry.aggPts != null ? entry.aggPts : (entry.agg_pts != null ? entry.agg_pts : '—');

    return `                    <tr>
                      <td class="standings__cell--pos"><span class="${posClass}">${pos}</span></td>
                      <th scope="row"><span class="standings__driver"><span class="standings__dot" style="--dot:${dot}"></span><span>${driver}${country}</span></span></th>
                      <td class="standings__cell--num">${carNumber}</td>
                      <td>${car}</td>
                      <td>${carClass}</td>
                      <td class="standings__cell--num">${start}</td>
                      <td class="standings__cell--num">${interval}</td>
                      <td class="standings__cell--num">${avgLap}</td>
                      <td class="standings__cell--num">${bestLapContent}</td>
                      <td class="standings__cell--num">${lapsContent}</td>
                      <td class="standings__cell--num">${inc}</td>
                      <td class="standings__cell--num standings__points">${champPts}</td>
                      <td class="standings__cell--num">${aggPts}</td>
                    </tr>`;
  }).join('\n');
}

let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Target the details element: id="r1", id="r2", etc.
const detailsRegex = new RegExp(`(<details[^>]*id=["']r${roundNum}["'][^>]*>[\\s\\S]*?<\\/details>)`, 'i');
const match = htmlContent.match(detailsRegex);

if (!match) {
  console.error(`Error: Could not locate <details id="r${roundNum}"> inside "${htmlPath}".`);
  process.exit(1);
}

let detailsBlock = match[1];

const resultsArray = raceData.results || raceData.standings;

if (raceData.races && Array.isArray(raceData.races)) {
  // Double header (multiple races)
  const tbodyRegex = /(<tbody[^>]*>)([\s\S]*?)(<\/tbody>)/gi;
  let raceIndex = 0;
  detailsBlock = detailsBlock.replace(tbodyRegex, (fullMatch, openTag, oldBody, closeTag) => {
    if (raceIndex < raceData.races.length) {
      const newRows = generateRows(raceData.races[raceIndex].results || raceData.races[raceIndex].standings);
      raceIndex++;
      return `${openTag}\n${newRows}\n                  ${closeTag}`;
    }
    return fullMatch;
  });
  console.log(`Updated ${raceIndex} race tables in Round ${roundNum}.`);
} else if (resultsArray && Array.isArray(resultsArray)) {
  // Single race
  // Auto-detect fastest lap if not explicitly marked
  let bestTimeMs = Infinity;
  let bestIndex = -1;
  resultsArray.forEach((r, idx) => {
    const lap = r.bestLap || r.best_lap;
    if (lap && lap !== '—') {
      const parts = lap.split(':');
      if (parts.length === 2) {
        const ms = (parseFloat(parts[0]) * 60 + parseFloat(parts[1])) * 1000;
        if (ms < bestTimeMs) {
          bestTimeMs = ms;
          bestIndex = idx;
        }
      }
    }
  });
  if (bestIndex !== -1 && resultsArray[bestIndex].isFastestLap == null) {
    resultsArray[bestIndex].isFastestLap = true;
  }

  const tbodyRegex = /(<tbody[^>]*>)([\s\S]*?)(<\/tbody>)/i;
  const newRows = generateRows(resultsArray);
  detailsBlock = detailsBlock.replace(tbodyRegex, `$1\n${newRows}\n                  $3`);
  console.log(`Updated single race table in Round ${roundNum} with ${resultsArray.length} rows.`);
} else {
  console.error('Error: JSON data must contain either a "results", "standings", or "races" array.');
  process.exit(1);
}

htmlContent = htmlContent.replace(detailsRegex, detailsBlock);
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`Successfully updated ${htmlPath} for Round ${roundNum}!`);
