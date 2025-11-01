const https = require("https");

// URL tới JSON raw trên GitHub (thay link của bạn)
const RAW_JSON_URL = "https://raw.githubusercontent.com/username/repo/main/data.json";

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút cache

// Hàm tải dữ liệu JSON từ GitHub raw
async function fetchRemoteJSON() {
  const now = Date.now();
  if (cachedData && now - lastFetch < CACHE_DURATION) return cachedData;

  return new Promise((resolve, reject) => {
    https.get(RAW_JSON_URL, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          cachedData = json;
          lastFetch = now;
          resolve(json);
        } catch (err) {
          console.error("[match-file]❌ Lỗi parse JSON:", err);
          reject(err);
        }
      });
    }).on("error", err => {
      console.error("[match-file]⚠️ Lỗi tải GitHub raw:", err);
      reject(err);
    });
  });
}

// Hàm tìm file (giờ là key trong JSON)
async function findMatchingFile(keyword) {
  if (!keyword) return null;
  const jsonData = await fetchRemoteJSON();
  const msg = keyword.toLowerCase();

  for (const key of Object.keys(jsonData)) {
    if (
      key.toLowerCase() === msg ||
      key.toLowerCase().includes(msg) ||
      msg.includes(key.toLowerCase())
    ) {
      // Trả về đối tượng JSON khớp
      return {
        key,
        data: jsonData[key]
      };
    }
  }
  return null;
}

module.exports = { findMatchingFile };
