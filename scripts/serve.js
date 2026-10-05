#!/usr/bin/env node
/* ==========================================================
   Local preview server (no installs needed, just Node).

   Run:   node scripts/serve.js
   Then open http://localhost:8000 in your browser.
   It re-checks your bulletins each time it starts; refresh the
   browser after editing a file to see changes.
   ========================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

require("./build").run();   // prints any problems and refreshes bulletins/index.json

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8000;
const SERVED = new Set(["index.html", "assets", "bulletins"]);   // only what the website needs
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

http
  .createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split("?")[0]);
    } catch (_) {
      res.writeHead(400).end("Bad request");
      return;
    }
    if (urlPath.endsWith("/")) urlPath += "index.html";

    const file = path.normalize(path.join(ROOT, urlPath));
    const top = path.relative(ROOT, file).split(path.sep)[0];
    if (!file.startsWith(ROOT + path.sep) || !SERVED.has(top)) {
      res.writeHead(404).end("Not found");
      return;
    }

    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    });
  })
  .listen(PORT, () => console.log(`Preview running at http://localhost:${PORT}  (press Ctrl+C to stop)`));
