/* ==========================================================
   UP CURSOR Monthly Bulletin — page script

   What it does:
   1. Finds which month to show (see pickDefault below).
   2. Loads bulletins/<month>/data.json and draws the page.
   3. If that file is missing or broken, shows the previous month
      with a short notice instead of a blank page.

   Everything from data.json is inserted as plain text (never as
   HTML), so a stray "<" or quote in the data can't break the page.
   ========================================================== */
(() => {
  "use strict";

  const BASE = "bulletins/";
  const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ITEMS_PER_COLUMN = 6;   // a card gets another column for every 6 items
  const MAX_COLUMNS = 3;

  const $ = (id) => document.getElementById(id);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- Small helpers ---------- */

  const str = (v) => (typeof v === "string" ? v.trim() : "");
  const list = (v) => (Array.isArray(v) ? v : []);

  function monthKeyNow() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function recentMonths(count) {
    const out = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < count; i++) {
      out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
      d.setMonth(d.getMonth() - 1);
    }
    return out;                                 // newest first
  }

  function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
    return { name, year: String(y), full: name + " " + y };
  }

  /* Accepts only real calendar dates written as YYYY-MM-DD. */
  function parseDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof value === "string" ? value.trim() : "");
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const check = new Date(Date.UTC(y, mo - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    return { y, mo, d, key: m[0] };
  }

  /* Only web links are allowed. Anything else (like javascript:) is dropped. */
  function safeUrl(raw) {
    let u = str(raw);
    if (!u) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
    try {
      const url = new URL(u);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  async function getJSON(url) {
    let res;
    try {
      res = await fetch(url, { cache: "no-cache" });
    } catch (_) {
      const err = new Error("network");
      err.kind = "network";
      throw err;
    }
    if (!res.ok) {
      const err = new Error("HTTP " + res.status);
      err.kind = res.status === 404 ? "missing" : "network";
      throw err;
    }
    try {
      return await res.json();
    } catch (_) {
      const err = new Error("invalid");
      err.kind = "invalid";
      throw err;
    }
  }

  function reason(err) {
    if (err.kind === "missing") return "there is no data.json for it yet";
    if (err.kind === "invalid") return "its data.json has a typo (a missing comma or quote, for example)";
    return "it could not be loaded";
  }

  /* ---------- Turning data.json into clean lists ---------- */

  /* For Org Dates and UP Dates. Items without a valid date or label are skipped. */
  function readDated(items, textKey, makeText) {
    return list(items)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const date = parseDate(item.date);
        const label = str(item[textKey]);
        if (!date || !label) return null;
        const end = parseDate(item.endDate);
        return {
          date,
          end: end && end.key > date.key ? end : null,
          text: makeText ? makeText(label) : label,
          note: str(item.note),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.key.localeCompare(b.date.key) || a.text.localeCompare(b.text));
  }

  function readLinks(items) {
    return list(items)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const href = safeUrl(item.url);
        if (!href) return null;
        const shown = str(item.label) || str(item.url).replace(/^https?:\/\//i, "").replace(/\/$/, "");
        return { href, text: shown };
      })
      .filter(Boolean);
  }

  function readReminders(items) {
    return list(items).map(str).filter(Boolean);
  }

  /* ---------- Drawing ---------- */

  function badge(item, monthKey) {
    const box = el("span", "badge");
    const sameMonth = (d) => d.y + "-" + String(d.mo).padStart(2, "0") === monthKey;
    box.appendChild(el("strong", "", item.end ? item.date.d + "–" + item.end.d : String(item.date.d)));

    let small = "";
    if (item.end && (item.end.mo !== item.date.mo || item.end.y !== item.date.y)) {
      small = MONTH_ABBR[item.date.mo - 1] + "–" + MONTH_ABBR[item.end.mo - 1];
    } else if (!sameMonth(item.date)) {
      small = MONTH_ABBR[item.date.mo - 1];
    }
    if (small) box.appendChild(el("small", "", small));
    return box;
  }

  function dateRow(item, monthKey) {
    const li = el("li", "row");
    li.appendChild(badge(item, monthKey));
    const text = el("span", "row-text");
    text.appendChild(el("span", "row-title", item.text));
    if (item.note) text.appendChild(el("span", "row-note", item.note));
    li.appendChild(text);
    return li;
  }

  function linkRow(item) {
    const li = el("li");
    const a = el("a", "link", item.text);
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    return li;
  }

  /* Builds one card, or returns null when there is nothing to show
     (so empty sections simply disappear and the others take the space). */
  function makeCard(title, kind, items, buildRow) {
    if (!items.length) return null;
    const card = el("section", "card card-" + kind);
    const cols = Math.min(MAX_COLUMNS, Math.ceil(items.length / ITEMS_PER_COLUMN));
    card.style.setProperty("--cols", String(cols));
    card.appendChild(el("h2", "", title));
    const ul = el("ul", "list");
    items.forEach((item) => ul.appendChild(buildRow(item)));
    card.appendChild(ul);
    return card;
  }

  function render(key, data, months) {
    data = data && typeof data === "object" && !Array.isArray(data) ? data : {};
    const label = monthLabel(key);

    // Header
    const month = $("month");
    month.textContent = "";
    month.appendChild(el("span", "m-name", label.name));
    month.appendChild(document.createTextNode(" "));
    month.appendChild(el("span", "m-year", label.year));
    document.title = "UP CURSOR Monthly Bulletin — " + label.full;

    // Reminders (to the right of the header)
    const reminders = readReminders(data.reminders);
    const rBox = $("reminders");
    const rList = $("reminders-list");
    rList.textContent = "";
    reminders.forEach((text) => {
      const li = el("li");
      li.appendChild(el("span", "", text));
      rList.appendChild(li);
    });
    rBox.style.setProperty("--rcols", reminders.length > 6 ? "2" : "1");
    rBox.hidden = reminders.length === 0;

    // Cards
    const cards = $("cards");
    cards.textContent = "";
    const dateRowFor = (item) => dateRow(item, key);
    [
      makeCard("Org Dates", "org", readDated(data.orgDates, "label"), dateRowFor),
      makeCard("UP Dates", "up", readDated(data.upDates, "label"), dateRowFor),
      makeCard("Birthdays", "birthdays", readDated(data.birthdays, "name", (n) => n + "’s Birthday"), dateRowFor),
      makeCard("Important Links", "links", readLinks(data.links), linkRow),
    ].forEach((card) => card && cards.appendChild(card));

    // Image (bulletins/<month>/image.jpg). Hidden if it can't be loaded.
    const hero = $("hero");
    const img = $("hero-img");
    hero.hidden = true;
    img.onload = () => { hero.hidden = false; };
    img.onerror = () => { hero.hidden = true; };
    img.src = BASE + key + "/image.jpg";

    // Month switcher
    const switcher = $("switcher");
    const select = $("month-select");
    select.textContent = "";
    if (months && months.length > 1) {
      months.forEach((m) => {
        const option = el("option", "", monthLabel(m).full);
        option.value = m;
        select.appendChild(option);
      });
      select.value = key;
      select.onchange = () => {
        location.search = "?m=" + encodeURIComponent(select.value);
      };
      switcher.hidden = false;
    } else {
      switcher.hidden = true;
    }
  }

  function showNotice(text) {
    const box = $("notice");
    box.textContent = text;
    box.hidden = false;
  }

  /* ---------- Choosing the month ---------- */

  /* Newest month that is not in the future. This lets officers prepare
     next month's bulletin early without it showing up too soon.
     If every month is in the future, show the earliest one. */
  function pickDefault(months) {          // months: newest first
    const now = monthKeyNow();
    return months.find((m) => m <= now) || months[months.length - 1];
  }

  async function loadMonthList() {
    try {
      const index = await getJSON(BASE + "index.json");
      const months = list(index && index.months)
        .filter((m) => typeof m === "string" && MONTH_RE.test(m))
        .sort()
        .reverse();
      return months.length ? months : null;
    } catch (_) {
      return null;
    }
  }

  async function main() {
    const asked = new URLSearchParams(location.search).get("m");
    const requested = asked && MONTH_RE.test(asked) ? asked : null;

    // Preferred: the list made by scripts/build.js. Backup: look back over the last 12 months.
    const months = await loadMonthList();
    let candidates;
    if (months) {
      const first = requested || pickDefault(months);
      candidates = [first, ...months.filter((m) => m < first)];
    } else {
      candidates = recentMonths(12);
      if (requested) candidates.unshift(requested);
    }

    const problems = [];
    for (const key of candidates) {
      try {
        const data = await getJSON(BASE + key + "/data.json");
        render(key, data, months);
        // Only mention a problem if the month was asked for, or was known to exist.
        if (problems.length && (requested || months)) {
          showNotice(
            "Couldn’t show " + monthLabel(problems[0].key).full + " because " + reason(problems[0].err) +
            ". Showing " + monthLabel(key).full + " instead."
          );
        }
        return;
      } catch (err) {
        problems.push({ key, err });
      }
    }

    // Nothing worked at all.
    $("reminders").hidden = true;
    $("month").textContent = "";
    showNotice(
      problems.length && problems[0].err.kind === "invalid"
        ? "The bulletin’s data has a typo, so it can’t be shown right now."
        : "No bulletin has been published yet. Please check back soon."
    );
  }

  main();
})();
