#!/usr/bin/env node
/**
 * LeeOnTrack asset minifier — zero dependencies (plain Node.js).
 *
 * Usage (from the repo root, after editing styles.css or main.js):
 *     node tools/minify.js
 *
 * What it does:
 *   1. assets/css/styles.css -> assets/css/styles.min.css
 *   2. assets/js/main.js     -> assets/js/main.min.js
 *   3. Rewrites every page's <link>/<script> to the .min file with a content-hash
 *      ?v= query, so browsers (and GitHub Pages' 10-minute cache) pick up changes
 *      automatically — no manual version bumps.
 *
 * Why hand-rolled: the site deliberately avoids npm build chains. The minifiers are
 * conservative (comments + whitespace only, string/regex-aware) so they cannot
 * change behaviour; GitHub Pages gzip handles the rest.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CSS_SRC = 'assets/css/styles.css';
const CSS_OUT = 'assets/css/styles.min.css';
const JS_SRC = 'assets/js/main.js';
const JS_OUT = 'assets/js/main.min.js';
/** Folders never scanned for HTML (old copies, tooling, VCS). */
const SKIP_DIRS = new Set(['.git', '.agents', 'node_modules', 'LeeOnTrack', 'tools']);
const HASH_LENGTH = 10;

/**
 * Reads a quoted string starting at index i (src[i] is the quote).
 * Returns the index just past the closing quote. Handles backslash escapes.
 */
function skipString(src, i) {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length && src[j] !== quote) {
    j += src[j] === '\\' ? 2 : 1;
  }
  return j + 1;
}

/**
 * CSS: strip comments, collapse whitespace, and drop spaces around { } ; , and
 * after ':' only. Spaces BEFORE ':' are kept because "a :hover" (descendant)
 * differs from "a:hover". Spaces around + - * / are kept so calc() stays valid.
 */
function minifyCss(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const end = skipString(src, i);
      out += src.slice(i, end);
      i = end;
    } else if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
    } else if (/\s/.test(ch)) {
      while (i < src.length && /\s/.test(src[i])) i++;
      const prev = out[out.length - 1];
      const next = src[i];
      const noSpace = !prev || '{};,:>'.includes(prev) || (next && '{};,>'.includes(next));
      if (!noSpace) out += ' ';
    } else {
      out += ch;
      i++;
    }
  }
  return out.replace(/;}/g, '}').trim() + '\n';
}

/**
 * JS: remove comments, leading/trailing indentation and blank lines while keeping
 * line breaks (so automatic semicolon insertion behaves exactly as in the source).
 * Strings, template literals and regex literals are copied verbatim.
 */
function minifyJs(src) {
  let out = '';
  let i = 0;
  let lastSignificant = '';
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(src, i);
      out += src.slice(i, end);
      lastSignificant = ch;
      i = end;
    } else if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
    } else if (ch === '/' && (lastSignificant === '' || '(,=:[!&|?{};+-*%<>~^'.includes(lastSignificant))) {
      // Regex literal: copy through the closing slash, honouring escapes and [classes].
      let j = i + 1;
      let inClass = false;
      while (j < src.length && (inClass || src[j] !== '/')) {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        j++;
      }
      j++;
      while (/[a-z]/i.test(src[j] || '')) j++;
      out += src.slice(i, j);
      lastSignificant = '/';
      i = j;
    } else {
      out += ch;
      if (!/\s/.test(ch)) lastSignificant = ch;
      i++;
    }
  }
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n') + '\n';
}

/** Short content hash used as the cache-busting ?v= value. */
function contentHash(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, HASH_LENGTH);
}

/** Recursively lists .html files under dir, skipping SKIP_DIRS. */
function findHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : findHtml(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

/** Builds one asset and returns its hash. */
function build(srcRel, outRel, minifier) {
  const src = fs.readFileSync(path.join(ROOT, srcRel), 'utf8');
  const min = minifier(src);
  fs.writeFileSync(path.join(ROOT, outRel), min, 'utf8');
  const pct = (100 - (min.length / src.length) * 100).toFixed(1);
  console.log(`${outRel}: ${(src.length / 1024).toFixed(1)} KB -> ${(min.length / 1024).toFixed(1)} KB (-${pct}%)`);
  return contentHash(min);
}

function main() {
  const cssHash = build(CSS_SRC, CSS_OUT, minifyCss);
  const jsHash = build(JS_SRC, JS_OUT, minifyJs);

  // Matches both the source and .min names, with or without an existing ?v=.
  const cssRef = /assets\/css\/styles(?:\.min)?\.css(?:\?v=[0-9a-z]+)?/g;
  const jsRef = /assets\/js\/main(?:\.min)?\.js(?:\?v=[0-9a-z]+)?/g;

  let updated = 0;
  for (const file of findHtml(ROOT)) {
    const html = fs.readFileSync(file, 'utf8');
    const next = html
      .replace(cssRef, `assets/css/styles.min.css?v=${cssHash}`)
      .replace(jsRef, `assets/js/main.min.js?v=${jsHash}`);
    if (next !== html) {
      fs.writeFileSync(file, next, 'utf8');
      updated++;
    }
  }
  console.log(`HTML references updated in ${updated} file(s) (css v=${cssHash}, js v=${jsHash}).`);
}

if (require.main === module) main();

module.exports = { minifyCss, minifyJs };

