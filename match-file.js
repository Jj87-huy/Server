/**
 * match-jsonbin.js
 * Tự động đọc dữ liệu JSON từ JSONBin.io (API riêng của bạn)
 */

const https = require("https");

// 🔗 Thay bằng link API JSONBin thật của bạn
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6905b011d0ea881f40cb2e9a/latest";

// Nếu bin của bạn PRIVATE thì thêm API key:
const JSONBIN_API_KEY = "$2a$10$vhf2CES/NRLb3ZiPwObFj.WZDvm4LtswVLvwKOdR5wBtulZNBiMPi";

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // cache 5 phút

// 🧠 Hàm lấy dữ liệu từ JSONBin
async function fetchJsonBin() {
  const now = Date.now();
  if (cachedData && now - lastFetch < CACHE_DURATION) return cachedData;

  return new Promise((resolve, reject) => {
    const options = new URL(JSONBIN_URL);
    if (JSONBIN_API_KEY) {
      options.headers = {
        "X-Master-Key": JSONBIN_API_KEY,
      };
    }

    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          // JSONBin trả về { record: {...} }
          const record = json.record || json;
          cachedData = record;
          lastFetch = now;
          resolve(record);
        } catch (err) {
          console.error("[match-jsonbin]❌ Parse JSON lỗi:", err);
          reject(err);
        }
      });
    }).on("error", (err) => {
      console.error("[match-jsonbin]⚠️ Fetch JSONBin lỗi:", err);
      reject(err);
    });
  });
}

// 🔍 Tìm dữ liệu theo tên
async function findMatchingFile(keyword) {
  if (!keyword) return null;
  const jsonData = await fetchJsonBin();
  const msg = keyword.toLowerCase();

  for (const key of Object.keys(jsonData)) {
    if (
      key.toLowerCase() === msg ||
      key.toLowerCase().includes(msg) ||
      msg.includes(key.toLowerCase())
    ) {
      const data = jsonData[key];
      return {
        key,
        data: {
          description: data.description || "",
          image: data.image || "",
          video: data.video || "",
          timestamp: new Date().toLocaleString("vi-VN"),
        },
      };
    }
  }
  return null;
}

module.exports = { findMatchingFile };
