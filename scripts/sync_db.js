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
const doOverwrite = argv.overwrite || false;
const baseDay = argv['base-day'] ? parseInt(argv['base-day'], 10) : 10;
const doDry = argv.dry || false;

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
  // Prefer specific Korean column names if present in the DB
  const sentenceKeys = ['예문', 'example', 'sentence'];
  const translationKeys = ['예문 해석', 'translation', 'translate'];
  // DB change: previous "뜻 (클릭하면 설명)" renamed to "어휘"; a new "뜻" property exists for definition
  const answerKeys = ['어휘', '뜻 (클릭하면 설명)', 'meaning', 'vocab', 'word'];
  const meaningKeys = ['뜻', 'meaning', 'definition', '설명'];
  const dayKeys = ['day', 'Day', 'Day'];

  function findProp(keysList) {
    for (const k of Object.keys(props)) {
      for (const candidate of keysList) {
        if (k.toLowerCase() === candidate.toLowerCase()) return props[k];
      }
    }
    return null;
  }

  const sentenceProp = findProp(sentenceKeys);
  const translationProp = findProp(translationKeys);
  const answerProp = findProp(answerKeys);
  const meaningProp = findProp(meaningKeys);
  const dayProp = findProp(Object.keys(props));

  const fullSentence = propText(sentenceProp) || '';
  const translation = propText(translationProp) || '';
  const meaning = propText(meaningProp) || '';

  // answer: prefer answerProp (new column '어휘'), fall back to old/meaning fields
  let answer = propText(answerProp) || '';
  if (!answer) answer = propText(meaningProp) || '';

  // If answer is empty, try to infer from sentence by taking the last token or quoted part
  if (!answer && fullSentence) {
    // fallback: pick the shortest word > 2 chars that appears in sentence
    const tokens = fullSentence.replace(/[.,!?]/g, '').split(/\s+/).filter(t => t.length > 1);
    if (tokens.length > 0) answer = tokens[Math.floor(tokens.length / 2)];
  }

  // Build prefix/suffix by locating the answer inside the fullSentence
  let prefix = '';
  let suffix = '';
  if (answer && fullSentence) {
    try {
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      const match = re.exec(fullSentence);
      if (match) {
        const idx = match.index;
        // Preserve the original spacing around the blank so punctuation stays
        // in the correct place. Do not trim trailing/leading spaces here —
        // keep the space before the answer as part of prefix and any
        // following space as part of suffix.
        prefix = fullSentence.slice(0, idx).replace(/\s+/g, ' ');
        suffix = fullSentence.slice(idx + match[0].length).replace(/\s+/g, ' ');
      } else {
        // Try a fuzzy in-order match for multi-word answers where words
        // may be separated by small words (e.g. "put me through" vs "put through")
        const answerWords = (answer || '').split(/\s+/).filter(Boolean);
        if (answerWords.length > 1) {
          // build a regex like: \bword1\b(?:\s+\w+){0,3}?\s+\bword2\b ...
          const parts = answerWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const fuzzy = parts.map(p => `\\b${p}\\b`).join('(?:[\\s\\w]{0,20}?)');
          try {
            const re = new RegExp(fuzzy, 'i');
            const m2 = re.exec(fullSentence);
            if (m2) {
              const idx2 = m2.index;
              prefix = fullSentence.slice(0, idx2).replace(/\s+/g, ' ');
              suffix = fullSentence.slice(idx2 + m2[0].length).replace(/\s+/g, ' ');
            } else {
              suffix = fullSentence;
            }
          } catch (err) {
            suffix = fullSentence;
          }
        } else {
          // If exact match not found, leave full sentence as suffix
          suffix = fullSentence;
        }
      }
    } catch (err) {
      suffix = fullSentence;
    }
  } else {
    suffix = fullSentence;
  }

  const dayRaw = (function () {
    for (const k of Object.keys(props)) {
      if (/^day$/i.test(k)) return propText(props[k]);
    }
    return '';
  })();

  return {
    answer: (answer || '').trim(),
    // preserve prefix/suffix spacing (do not trim) so UI can decide how to attach punctuation
    prefix: prefix || '',
    suffix: suffix || '',
    meaning: (meaning || '').trim(),
    translation: (translation || '').trim(),
    dayRaw: dayRaw || ''
  };
}

function computeAddedDateForDay(dayNumber, startDateStr, baseDayNumber = 10) {
  const start = new Date(startDateStr + 'T00:00:00');
  const offset = Math.max(0, dayNumber - baseDayNumber);
  const target = addBusinessDays(start, offset);
  return formatDate(target);
}

async function main() {
  console.log('Fetching pages from Notion...');
  const pages = await fetchNotionPages();
  console.log(`Fetched ${pages.length} rows`);

  if (doDry) {
    // Collect unique property keys and print samples
    const propKeys = new Set();
    pages.slice(0, 40).forEach((p, idx) => {
      const keys = Object.keys(p.properties || {});
      keys.forEach(k => propKeys.add(k));
      console.log(`\n--- Page ${idx + 1} properties:`);
      keys.forEach(k => {
        const val = propText(p.properties[k]);
        console.log(`  ${k}: ${val.substring(0, 120)}`);
      });
    });
    console.log('\nUnique property keys found:');
    console.log(Array.from(propKeys).join(', '));
    // Also show how pages map to our entry format and computed addedDate
    console.log('\nSample mapped entries:');
    const mappedList = pages.map(p => mapPageToEntry(p));
    mappedList.slice(0, 20).forEach((mapped, idx) => {
      const dayNumMatch = (mapped.dayRaw && mapped.dayRaw.match(/\d+/));
      const dayNum = dayNumMatch ? parseInt(dayNumMatch[0], 10) : baseDay;
      const added = computeAddedDateForDay(dayNum || baseDay, startDateStr, baseDay);
      console.log(`\nEntry ${idx + 1}:`);
      console.log(`  answer: ${mapped.answer}`);
      console.log(`  prefix: ${mapped.prefix}`);
      console.log(`  suffix: ${mapped.suffix}`);
      console.log(`  meaning: ${mapped.meaning}`);
      console.log(`  translation: ${mapped.translation}`);
      console.log(`  dayRaw: ${mapped.dayRaw}`);
      console.log(`  -> computed addedDate: ${added}`);
    });

    // Also summarize visibility up to today (KST)
    const mappedAll = mappedList.map(m => {
      const dayNumMatch = (m.dayRaw && m.dayRaw.match(/\d+/));
      const dayNum = dayNumMatch ? parseInt(dayNumMatch[0], 10) : baseDay;
      return { ...m, addedDate: computeAddedDateForDay(dayNum || baseDay, startDateStr, baseDay) };
    });
    const todayKST = formatDate(new Date(Date.now() + 9 * 60 * 60 * 1000));
    const visibleCount = mappedAll.filter(x => x.addedDate && x.addedDate <= todayKST).length;
    console.log(`\nSummary: mapped ${mappedAll.length} entries, ${visibleCount} would be visible up to ${todayKST} (KST) using --start ${startDateStr} and --base-day ${baseDay}`);
    process.exit(0);
  }

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
    addedDate: computeAddedDateForDay(e.day || baseDay, startDate, baseDay)
  }));

  // Read existing questions.js
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');

  if (doOverwrite) {
    // Overwrite mode: replace QUESTIONS array entirely with `final` entries
    const newFileText = raw.replace(/const QUESTIONS =\s*\[(?:[\s\S]*?)\];/m, `const QUESTIONS = ${JSON.stringify(final, null, 2)};`);
    fs.writeFileSync(QUESTIONS_FILE, newFileText, 'utf8');
    console.log(`Overwrote ${QUESTIONS_FILE} with ${final.length} entries`);
  } else {
    // Append mode: try to parse existing array and merge without duplicates
    const m = raw.match(/const QUESTIONS =\s*\[(?:[\s\S]*?)\];/m);
    let existing = [];
    if (m) {
      const arrText = m[0].replace(/const QUESTIONS =\s*/, '').replace(/;\s*$/, '');
      try {
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
    const newFileText = raw.replace(/const QUESTIONS =\s*\[(?:[\s\S]*?)\];/m, `const QUESTIONS = ${JSON.stringify(merged, null, 2)};`);
    fs.writeFileSync(QUESTIONS_FILE, newFileText, 'utf8');
    console.log(`Appended ${toAdd.length} new entries to ${QUESTIONS_FILE}`);
  }

  if (doCommit) {
    const { execSync } = require('child_process');
    try {
      const numAdded = doOverwrite ? final.length : (typeof toAdd !== 'undefined' ? toAdd.length : 0);
      execSync(`git add ${QUESTIONS_FILE}`);
      execSync(`git commit -m "chore: sync questions from Notion (${numAdded} added)"`);
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
