const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const https = require("https");
const vm = require("vm");
const { URL } = require("url"); // ✅ Thêm dòng này
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

let modul = process.env.MODULE;
let PORT = process.env.PORT;
let HOST = process.env.HOST || "0.0.0.0";

const cors = require("cors");
app.use(cors({
  origin: ["https://kbot-ai.name.vn", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ===========================
// ⚙️ Gemini API Key Management
// ===========================
let apiKeys = [];
if (process.env.GEMINI_API_KEYS) {
  apiKeys = process.env.GEMINI_API_KEYS.split(",").map(k => k.trim());
} else if (process.env.GEMINI_API_KEY) {
  apiKeys = [process.env.GEMINI_API_KEY];
} else {
  console.warn("[GENIMI API KEY]⚠️ GEMINI_API_KEY(S) not found in .env");
}

let currentKeyIndex = 0;
function getCurrentKey() { return apiKeys[currentKeyIndex]; }
function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`[GENIMI API KEY]🔄 Switch to another API Key (${currentKeyIndex + 1}/${apiKeys.length})`);
}
function createModel() {
  const key = getCurrentKey();
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: modul });
}
let model = createModel();

// ===========================
// 🧩 Load module from GitHub raw
// ===========================
async function loadRemoteModule(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const script = new vm.Script(data, { filename: "remote-module.js" });
          const sandbox = { module: {}, require, console, URL }; // ✅ Cho vào sandbox
          script.runInNewContext(sandbox);
          resolve(sandbox.module.exports);
        } catch (err) { reject(err); }
      });
    }).on("error", reject);
  });
}

// GitHub URLs
const MODULE_URLS = {
  analyzeText: "https://raw.githubusercontent.com/Jj87-huy/Server/main/Analyze.js",
  translateText: "https://raw.githubusercontent.com/Jj87-huy/Server/main/translate-text.js",
  matchFile: "https://raw.githubusercontent.com/Jj87-huy/Server/main/match-file.js",
  apiRequest: "https://raw.githubusercontent.com/Jj87-huy/Server/main/api-requets.js",
  utils: "https://raw.githubusercontent.com/Jj87-huy/Server/main/utils.js"
};

let analyzeText, translateText, matchFile, historyModule, apiRequest, utils;

// Load all modules with fallback
(async () => {
  try { analyzeText = await loadRemoteModule(MODULE_URLS.analyzeText); console.log("[GITHUB]✅ analyze.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback analyze.js"); analyzeText = async (model, text, tryRequest) => { const prompt = `Phân tích câu hỏi: "${text}"`; return (await tryRequest(prompt)).trim().toLowerCase(); }; }

  try { translateText = await loadRemoteModule(MODULE_URLS.translateText); console.log("[GITHUB]✅ translate-text.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback translate-text.js"); translateText = async (model, text, tryRequest) => (await tryRequest(`Dịch sang tiếng Việt: "${text}"`)).trim(); }

  try { matchFile = await loadRemoteModule(MODULE_URLS.matchFile); console.log("[GITHUB]✅ match-file.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback match-file.js"); matchFile = { getAllTextFiles, findMatchingFile }; }


  try { apiRequest = await loadRemoteModule(MODULE_URLS.apiRequest); console.log("[GITHUB]✅ api-request.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback api-request.js"); apiRequest = { tryRequest }; }

  try { utils = await loadRemoteModule(MODULE_URLS.utils); console.log("[GITHUB]✅ utils.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback utils.js"); utils = { isQuestion, sanitizeFileName, saveChat }; }
})();

// ===========================
// 📂 Folders & Utilities
// ===========================
const DATA_PATH = process.env.DATA_PATH;
const HISTORY_DIR = process.env.HISTORY_DIR;
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR);

// ===========================
// 🔁 Request AI + Retry Key
// ===========================
async function tryRequest(prompt, retry = true) {
  try {
    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (err) {
    console.error("[GENIMI]❌ Gemini Error:", err.message);
    if (retry && apiKeys.length > 1) {
      rotateKey();
      model = createModel();
      return tryRequest(prompt, false);
    }
    throw err;
  }
}

// ===========================
// 🧠 API /chat
// ===========================

// 🧠 JSONBin lưu dữ liệu AI học được
const JSONBIN_LEARNING_URL = "https://api.jsonbin.io/v3/b/6905b8dc43b1c97be9903e33";
const JSONBIN_KEY = "$2a$10$vhf2CES/NRLb3ZiPwObFj.WZDvm4LtswVLvwKOdR5wBtulZNBiMPi";

// 🪄 Hàm lưu dữ liệu mới vào JSONBin (POST / PUT)
async function saveToJSONBin(keyword, content) {
  const body = JSON.stringify({
    quet: {
      keyword: keyword,
      bot_reply: content,
      time: new Date().toLocaleString("vi-VN")
    }
  });

  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(JSONBIN_LEARNING_URL, options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();
  if (!userMessage) return res.json({ file: null, content: "Bạn chưa nhập gì 😅" });

  try {
    if (utils.isQuestion(userMessage)) {
      const mainKeyword = await analyzeText(model, userMessage, tryRequest);
      console.log(`🎯 Từ khóa chính: ${mainKeyword}`);

      // 📡 Gọi matchFile (đọc từ JSONBin hoặc GitHub)
      const matchedData = await matchFile.findMatchingFile(mainKeyword);

      // ✅ Có dữ liệu → hiển thị
      if (matchedData && matchedData.data) {
        const { key, data } = matchedData;
        const { description, image, video, timestamp } = data;

        const replyParts = [`${description || "Không có nội dung."}`];
        if (image && image.trim() !== "") replyParts.push(`${image}`);
        if (video && video.trim() !== "") replyParts.push(`${video}`);

        return res.json({ keyword: key, content: replyParts.join("\n") });
      }

      // ❌ Không tìm thấy → hỏi AI và lưu lại
      const noMatchPrompt = `Người dùng hỏi: "${userMessage}". 
Không có dữ liệu trong hệ thống. 
Hãy trả lời ngắn gọn, lịch sự, dễ hiểu (1-3 câu, tiếng Việt).`;
      const aiResponse = await tryRequest(noMatchPrompt);

      // ✍️ Lưu phản hồi vào JSONBin học tập
      try {
        await saveToJSONBin(mainKeyword, aiResponse);
        console.log(`📥 Đã lưu chủ đề mới vào JSONBin: ${mainKeyword}`);
      } catch (saveErr) {
        console.error("⚠️ Không thể lưu vào JSONBin:", saveErr.message);
      }

      return res.json({
        file: null,
        keyword: mainKeyword,
        content: aiResponse + "\n\n💾 (Đã lưu chủ đề mới vào hệ thống)",
      });
    }

    // 💬 Nếu chỉ trò chuyện
    const chatPrompt = `Người dùng nói: "${userMessage}". 
Hãy phản hồi thân thiện, vui vẻ (1-2 câu tiếng Việt).`;
    const reply = await tryRequest(chatPrompt);
    return res.json({ file: null, content: reply });

  } catch (err) {
    console.error("[SERVER ERR]⚠️", err);
    res.status(500).json({ file: null, content: "⚠️ Đã xảy ra lỗi khi xử lý yêu cầu." });
  }
});

// ===========================
// 🚀 Start server
// ===========================
app.listen(PORT, HOST, () => {
  console.log("[SERVER]✅ Server running at http://" + HOST + ":" + PORT);
  console.log(`[SERVER]🔑 Using ${apiKeys.length} API key [${apiKeys}]`);
});
