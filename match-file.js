// match-jsonbin.js
const https = require("https");

const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6905b011d0ea881f40cb2e9a/latest"; // ex: https://api.jsonbin.io/v3/b/<bin_id>/latest
const JSONBIN_KEY = "$2a$10$vhf2CES/NRLb3ZiPwObFj.WZDvm4LtswVLvwKOdR5wBtulZNBiMPi"; // X-Master-Key

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

function formatVNDateFull(date = new Date()) {
  const d = date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

async function fetchJSONBin() {
  const now = Date.now();
  if (!JSONBIN_URL) throw new Error("JSONBIN_URL is not set");
  if (!JSONBIN_KEY) throw new Error("JSONBIN_KEY is not set");

  if (cachedData && now - lastFetch < CACHE_DURATION) return cachedData;

  return new Promise((resolve, reject) => {
    const url = new URL(JSONBIN_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ""),
      method: "GET",
      headers: {
        "User-Agent": "node.js",
        "X-Master-Key": JSONBIN_KEY,
        "Accept": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          if (!raw.trim()) {
            console.warn("[match-jsonbin]⚠️ JSONBin returned empty body");
            return resolve({});
          }
          const parsed = JSON.parse(raw);

          // jsonbin v3 returns object with .record
          const record = parsed.record || parsed;

          // add timestamp to entries that have description but no timestamp
          const nowStr = formatVNDateFull();
          for (const k of Object.keys(record || {})) {
            const item = record[k];
            if (item && typeof item === "object") {
              if (!item.timestamp && item.description) {
                item.timestamp = nowStr;
              }
            }
          }

          cachedData = record;
          lastFetch = Date.now();
          resolve(record);
        } catch (err) {
          console.error("[match-jsonbin]❌ Parse error:", err);
          // nếu có cache cũ trả cache
          if (cachedData) return resolve(cachedData);
          reject(err);
        }
      });
    });

    req.on("error", (err) => {
      console.error("[match-jsonbin]⚠️ Request error:", err);
      if (cachedData) return resolve(cachedData);
      reject(err);
    });

    req.end();
  });
}

/**
 * Tìm entry khớp keyword trong JSONBin data.
 * Trả về: { key, data } hoặc null
 */
async function findMatchingFile(keyword) {
  if (!keyword) return null;
  const jsonData = await fetchJSONBin();
  if (!jsonData || typeof jsonData !== "object") return null;

  const msg = String(keyword).toLowerCase().trim();

  // 1) tìm exact key
  for (const key of Object.keys(jsonData)) {
    if (key.toLowerCase() === msg) {
      return { key, data: jsonData[key] };
    }
  }

  // 2) tìm key chứa msg
  for (const key of Object.keys(jsonData)) {
    if (key.toLowerCase().includes(msg)) {
      return { key, data: jsonData[key] };
    }
  }

  // 3) tìm msg chứa key (ngược lại)
  for (const key of Object.keys(jsonData)) {
    if (msg.includes(key.toLowerCase())) {
      return { key, data: jsonData[key] };
    }
  }

  return null;
}

module.exports = { findMatchingFile, fetchJSONBin };
