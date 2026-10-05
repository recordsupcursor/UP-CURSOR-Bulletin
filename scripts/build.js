#!/usr/bin/env node
/* ==========================================================
   Bulletin checker + month list builder (no installs needed).

   1. Checks every bulletins/YYYY-MM/data.json for mistakes.
   2. Writes bulletins/index.json (the list of months the site uses).

   Run it by hand:   node scripts/build.js
   GitHub runs it automatically every time you save a change.
   Exit code 1 means "found an error" (warnings don't fail it).
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "bulletins");
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const TOP_LEVEL = ["orgDates", "upDates", "birthdays", "links", "reminders"];
const BIG_IMAGE_BYTES = 2.5 * 1024 * 1024;

const ON_GITHUB = !!process.env.GITHUB_ACTIONS;

function run() {
  let errors = 0;
  let warnings = 0;

  const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
  const escapeGh = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

  function report(level, file, message) {
    if (level === "error") errors++; else warnings++;
    if (ON_GITHUB) {
      console.log(`::${level} file=${file}::${escapeGh(message)}`);
    } else {
      console.log(`${level === "error" ? "ERROR  " : "warning"}  ${file}: ${message}`);
    }
  }

  /* ----- value checks ----- */

  function validDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof value === "string" ? value : "");
    if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    const t = new Date(Date.UTC(y, mo - 1, d));
    return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
  }

  const isText = (v) => typeof v === "string" && v.trim() !== "";

  function webUrl(raw) {
    if (!isText(raw)) return false;
    let u = raw.trim();
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
    try {
      const url = new URL(u);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (_) {
      return false;
    }
  }

  function jsonProblem(err, text) {
    const m = /position (\d+)/.exec(err.message);
    if (m && !/line \d+/.test(err.message)) {
      const pos = Number(m[1]);
      const before = text.slice(0, pos);
      const line = before.split("\n").length;
      const col = pos - before.lastIndexOf("\n");
      return `${err.message} (near line ${line}, column ${col})`;
    }
    return err.message;
  }

  /* ----- one section of data.json ----- */

  function checkSection(file, month, name, value, allowed, checkItem) {
    if (value === undefined) return;
    if (!Array.isArray(value)) {
      report("error", file, `"${name}" must be a list written with [ ] brackets.`);
      return;
    }
    value.forEach((item, i) => {
      const where = `"${name}" item ${i + 1}`;
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        report("error", file, `${where} must be written with { } braces, like { "date": "2026-09-18", "label": "AKWE" }.`);
        return;
      }
      for (const key of Object.keys(item)) {
        if (!allowed.includes(key)) {
          report("warning", file, `${where} has an unknown field "${key}" (it will be ignored). Allowed fields: ${allowed.join(", ")}.`);
        }
      }
      checkItem(item, where);
    });
  }

  function inMonth(month, start, end) {
    // true if the date (or date range) touches the bulletin's month
    return start <= month + "-31" && (end || start) >= month + "-01";
  }

  function checkDates(file, month, item, where, textKey) {
    if (!validDate(item.date)) {
      report("error", file, `${where}: "date" must be a real date written as YYYY-MM-DD, like "${month}-18". Got: ${JSON.stringify(item.date)}.`);
    }
    if (!isText(item[textKey])) {
      report("error", file, `${where}: "${textKey}" is missing or empty.`);
    }
    if (item.endDate !== undefined) {
      if (!validDate(item.endDate)) {
        report("error", file, `${where}: "endDate" must be a real date written as YYYY-MM-DD. Got: ${JSON.stringify(item.endDate)}.`);
      } else if (validDate(item.date) && item.endDate <= item.date) {
        report("error", file, `${where}: "endDate" must be later than "date".`);
      }
    }
    if (item.note !== undefined && typeof item.note !== "string") {
      report("error", file, `${where}: "note" must be text in quotes.`);
    }
    if (validDate(item.date) && !inMonth(month, item.date, validDate(item.endDate) ? item.endDate : null)) {
      report("warning", file, `${where}: ${item.date} is outside ${month}. Is that intended? (It will show with its month name.)`);
    }
  }

  /* ----- one bulletin folder ----- */

  function checkMonth(month) {
    const folder = path.join(DIR, month);
    const dataPath = path.join(folder, "data.json");
    const file = rel(dataPath);

    if (!fs.existsSync(dataPath)) {
      report("error", rel(folder), `data.json is missing. Create it (copy template/data.json).`);
      return false;
    }

    let text = fs.readFileSync(dataPath, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      report("error", file, `Not valid JSON: ${jsonProblem(err, text)}. Check for a missing or extra comma, a missing quote, or a bracket that was never closed.`);
      return true;
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      report("error", file, "The file must start with { and end with }.");
      return true;
    }

    for (const key of Object.keys(data)) {
      if (!TOP_LEVEL.includes(key)) {
        report("warning", file, `Unknown section "${key}" (it will be ignored). Sections are: ${TOP_LEVEL.join(", ")}.`);
      }
    }

    const dated = ["date", "endDate", "label", "note"];
    checkSection(file, month, "orgDates", data.orgDates, dated, (it, w) => checkDates(file, month, it, w, "label"));
    checkSection(file, month, "upDates", data.upDates, dated, (it, w) => checkDates(file, month, it, w, "label"));
    checkSection(file, month, "birthdays", data.birthdays, ["date", "name"], (it, w) => checkDates(file, month, it, w, "name"));
    checkSection(file, month, "links", data.links, ["url", "label"], (it, w) => {
      if (!webUrl(it.url)) {
        report("error", file, `${w}: "url" must be a web address, like "bit.ly/CURSORCARES" or "https://example.com". Got: ${JSON.stringify(it.url)}.`);
      }
      if (it.label !== undefined && typeof it.label !== "string") {
        report("error", file, `${w}: "label" must be text in quotes.`);
      }
    });

    if (data.reminders !== undefined) {
      if (!Array.isArray(data.reminders)) {
        report("error", file, `"reminders" must be a list written with [ ] brackets.`);
      } else {
        data.reminders.forEach((r, i) => {
          if (!isText(r)) report("error", file, `"reminders" item ${i + 1} must be non-empty text in quotes.`);
        });
      }
    }

    // Image checks
    const imagePath = path.join(folder, "image.jpg");
    if (!fs.existsSync(imagePath)) {
      const others = fs.readdirSync(folder).filter((f) => /^image\./i.test(f));
      if (others.length) {
        report("warning", rel(folder), `Found "${others.join('", "')}" but the site only loads a file named exactly image.jpg (all lowercase). Rename it.`);
      } else {
        report("warning", rel(folder), "No image.jpg here, so this bulletin will have no picture.");
      }
    } else if (fs.statSync(imagePath).size > BIG_IMAGE_BYTES) {
      report("warning", rel(imagePath), "This image is over 2.5 MB. Please compress it so the page loads quickly.");
    }
    return true;
  }

  /* ----- main ----- */

  if (!fs.existsSync(DIR)) {
    console.log("ERROR  The bulletins/ folder is missing.");
    return 1;
  }

  const entries = fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  const months = [];

  for (const entry of entries) {
    if (MONTH_RE.test(entry.name)) {
      if (checkMonth(entry.name)) months.push(entry.name);
    } else if (!/^[._]/.test(entry.name)) {
      report("warning", "bulletins/" + entry.name, `Folder name is ignored. Month folders must be named YYYY-MM, like 2026-10.`);
    }
  }

  months.sort().reverse();
  fs.writeFileSync(
    path.join(DIR, "index.json"),
    JSON.stringify({ months, generated: new Date().toISOString() }, null, 2) + "\n"
  );

  console.log(
    `\nChecked ${months.length} bulletin(s): ${errors} error(s), ${warnings} warning(s).` +
    (months.length ? ` Newest: ${months[0]}.` : "")
  );
  return errors ? 1 : 0;
}

module.exports = { run };

if (require.main === module) {
  process.exit(run());
}
