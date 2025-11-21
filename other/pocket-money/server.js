// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

// ---- Paths ----
const app = express();
const PORT = process.env.PORT || 3000;

console.log(__dirname);

// Folder where your React build ends up (change to 'build' if CRA)
const STATIC_DIR = path.join(__dirname, "dist");
const INDEX_HTML = path.join(STATIC_DIR, "index.html");

// JSON file for persistent state
const DATA_FILE = path.join(__dirname, "pocket-money-data.json");

// ---- Helpers to load/save state ----
function loadState() {
  try {
    const text = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(text);
  } catch (e) {
    // File may not exist yet – return null so frontend uses defaults
    return null;
  }
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ---- Middleware ----
app.use(express.json());

// ---- API routes ----
app.get("/api/state", (req, res) => {
  const state = loadState();
  if (!state) {
    // Frontend will fall back to DEFAULT_CHILDREN etc.
    return res.json({
      children: null,
      choreStatus: null,
      weeklyAmount: null,
    });
  }
  res.json(state);
});

app.post("/api/state", (req, res) => {
  const state = req.body || {};
  saveState(state);
  res.json({ ok: true });
});

// ---- Static frontend ----
app.use(express.static(STATIC_DIR));


// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Pocket money app listening on http://localhost:${PORT}`);
});
