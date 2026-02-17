#!/usr/bin/env node
/**
 * scripts/sync_db.js
 *
 * Fetches rows from a Notion database and updates `questions.js` with entries.
 * Usage:
 *   node scripts/sync_db.js --source notion [--start 2026-02-18] [--commit]
 *
 * It expects `.env.local` (or environment) to contain NOTION_SECRET and NOTION_DATABASE_ID.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const NOTION_SECRET = (process.env.NOTION_SECRET || '').trim();
const NOTION_DATABASE_ID = (process.env.NOTION_DATABASE_ID || '').replace(/"/g, '').trim();

if (!NOTION_SECRET || !NOTION_DATABASE_ID) {
  console.error('Missing NOTION_SECRET or NOTION_DATABASE_ID in environment.');
  process.exit(1);
}

const QUESTIONS_FILE = path.join(process.cwd(), 'questions.js');

const argv = require('minimist')(process.argv.slice(2));
const startDateStr = argv.start || '2026-02-18';
const doCommit = argv.commit || false;

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addBusinessDays(d, n) {
  const res = new Date(d);
  let added = 0;
  while (added < n) {
    res.setDate(res.getDate() + 1);
    const day = res.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return res;
}

async function fetchNotionPages() {
  const pages = [];
  const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

  let next_cursor = null;
  do {
    const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
    const body = next_cursor ? { start_cursor: next_cursor } : {};
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_SECRET}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Notion API error: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (Array.isArray(data.results)) {
      pages.push(...data.results);
    }
    next_cursor = data.has_more ? data.next_cursor : null;
  } while (next_cursor);
  return pages;
}

function propText(prop) {
  if (!prop) return '';
  if (prop.title) {
    return prop.title.map(t => t.plain_text).join('');
  }
  if (prop.rich_text) {
    return prop.rich_text.map(t => t.plain_text).join('');
  }
  if (prop.rich_text === undefined && prop.type === 'rich_text' && Array.isArray(prop[prop.type])) {
    return prop[prop.type].map(t => t.plain_text).join('');
  }
  if (prop.select && prop.select.name) return prop.select.name;
  if (prop.number !== undefined && prop.number !== null) return String(prop.number);
  if (prop.formula && prop.formula.string) return prop.formula.string;
  return '';
}

function mapPageToEntry(page) {
  const props = page.properties || {};
  // Heuristics for common property names
  const keys = Object.keys(props).map(k => k.toLowerCase());

  // answer: try Title or Name
  let answer = '';
  for (const k of Object.keys(props)) {
    if (/^name$|^title$|^answer$|^word$/i.test(k)) {
      answer = propText(props[k]);
      if (answer) break;
    }
  }
  if (!answer) {
    // fallback to first title-like field
    for (const k of Object.keys(props)) {
      if (props[k] && props[k].title) {
        answer = propText(props[k]);
        break;
      }
    }
  }

  // prefix, suffix, meaning, translation, day
  let prefix = '';
  let suffix = '';
  let meaning = '';
  let translation = '';
  let dayVal = '';

  for (const k of Object.keys(props)) {
    const key = k.toLowerCase();
    const txt = propText(props[k]);
    if (!txt) continue;
    if (/^prefix$/i.test(key)) prefix = txt;
    else if (/^suffix$/i.test(key)) suffix = txt;
    else if (/^meaning$|^meanings$|^definition$|^note$/i.test(key)) meaning = txt;
    else if (/^translation$|^translate$|^kr$|^korean$/i.test(key)) translation = txt;
    else if (/^day$|^daynumber$|^day_number$|^day_no$|^d$/i.test(key)) dayVal = txt;
  }

  return {
    answer: answer || '',
    prefix: prefix || '',
    suffix: suffix || '',
    meaning: meaning || '',
    translation: translation || '',
    dayRaw: dayVal || ''
  };
}

function computeAddedDateForDay(dayNumber, startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const offset = Math.max(0, dayNumber - 10);
  const target = addBusinessDays(start, offset);
  return formatDate(target);
}

async function main() {
  console.log('Fetching pages from Notion...');
  const pages = await fetchNotionPages();
  console.log(`Fetched ${pages.length} rows`);

  const entries = pages.map(mapPageToEntry).filter(e => e.answer);

  // Partition entries into those with explicit day and those without
  const withDay = [];
  const withoutDay = [];
  for (const e of entries) {
    const m = e.dayRaw.match(/\d+/);
    if (m) withDay.push({ ...e, day: parseInt(m[0], 10) });
    else withoutDay.push(e);
  }

  // Sort withDay by day numeric
  withDay.sort((a, b) => a.day - b.day);

  // Assign days to withoutDay sequentially starting after the minimum available day (10)
  let nextDay = 10;
  if (withDay.length > 0) {
    // ensure we don't clobber provided days: pick nextDay as max(provided) + 1 if provided days include >=10
    const maxProvided = Math.max(...withDay.map(w => w.day));
    if (maxProvided >= 10) nextDay = maxProvided + 1;
  }
  for (const e of withoutDay) {
    e.day = nextDay;
    nextDay += 1; // increment day for each entry; grouping by 3/day is handled in date calc
  }

  const all = [...withDay, ...withoutDay];

  // Now map day -> addedDate, but since days represent release days (3 words/day), we assume day numbers are release-day counters
  const startDate = startDateStr;
  const final = all.map(e => ({
    answer: e.answer,
    prefix: e.prefix || '',
    suffix: e.suffix || '',
    meaning: e.meaning || '',
    translation: e.translation || '',
    addedDate: computeAddedDateForDay(e.day || 10, startDate)
  }));

  // Read existing questions.js and append new entries that don't duplicate by answer
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  // Extract existing array by finding the start of `const QUESTIONS = [` and the matching closing `];`
  const m = raw.match(/const QUESTIONS =\s*\[(?:[\s\S]*?)\];/m);
  let existing = [];
  if (m) {
    const arrText = m[0].replace(/const QUESTIONS =\s*/, '').replace(/;\s*$/, '');
    try {
      // unsafe eval: convert JS array to JSON by neutral replacements
      const jsonText = arrText
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
        .replace(/\'|\`/g, '"');
      existing = JSON.parse(jsonText);
    } catch (err) {
      console.warn('Could not parse existing QUESTIONS array; fallback to append-only');
      existing = [];
    }
  }

  const existingAnswers = new Set(existing.map(i => (i.answer || '').trim()));
  const toAdd = final.filter(i => !existingAnswers.has(i.answer.trim()));

  const merged = [...existing, ...toAdd];

  // Build replacement text (pretty simple JSON-ish)
  const newArrayText = JSON.stringify(merged, null, 2)
    .replace(/"(answer|prefix|suffix|meaning|translation|addedDate)":/g, '  $1:')
    .replace(/"/g, '"')
    .replace(/\n/g, '\n');

  const newFileText = raw.replace(/const QUESTIONS =\s*\[(?:[\s\S]*?)\];/m, `const QUESTIONS = ${JSON.stringify(merged, null, 2)};`);

  fs.writeFileSync(QUESTIONS_FILE, newFileText, 'utf8');
  console.log(`Wrote ${toAdd.length} new entries to ${QUESTIONS_FILE}`);

  if (doCommit) {
    const { execSync } = require('child_process');
    try {
      execSync(`git add ${QUESTIONS_FILE}`);
      execSync(`git commit -m "chore: sync questions from Notion (${toAdd.length} added)"`);
      execSync(`git push`);
      console.log('Committed and pushed changes.');
    } catch (err) {
      console.error('Git commit/push failed:', err.message);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
