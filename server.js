const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const https = require("https");
const vm = require("vm");
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
          const sandbox = { module: {}, require, console };
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
  historyModule: "https://raw.githubusercontent.com/Jj87-huy/Server/main/history.js",
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

  try { historyModule = await loadRemoteModule(MODULE_URLS.historyModule); console.log("[GITHUB]✅ history.js loaded"); }
  catch { console.warn("[GITHUB]⚠️ Fallback history.js"); historyModule = { listHistoryFiles: () => [], readHistoryFile: () => [] }; }

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
let currentHistoryFile = path.join(HISTORY_DIR, "default.json");

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();
  const historyFile = req.body.historyFile;

  if (!userMessage) return res.json({ file: null, content: "Bạn chưa nhập gì 😅" });

  if (historyFile && fs.existsSync(path.join(HISTORY_DIR, historyFile))) {
    currentHistoryFile = path.join(HISTORY_DIR, historyFile);
  } else if (currentHistoryFile.endsWith("default.json")) {
    const baseName = utils.sanitizeFileName(userMessage.slice(0, 50));
    currentHistoryFile = path.join(HISTORY_DIR, `${baseName} chat.json`);
  }

  try {
    utils.saveChat(currentHistoryFile, "user", userMessage);

    if (utils.isQuestion(userMessage)) {
      const mainKeyword = await analyzeText(model, userMessage, tryRequest);
      console.log(`🎯 Từ khóa chính: ${mainKeyword}`);

      const matchedFile = matchFile.findMatchingFile(mainKeyword);
      if (matchedFile && fs.existsSync(matchedFile)) {
        const content = fs.readFileSync(matchedFile, "utf8");
        const replyPrompt = `Người dùng hỏi: "${userMessage}". File: "${path.basename(matchedFile)}". Nội dung: ${content.slice(0, 1000)}. Hãy trả lời ngắn gọn, thân thiện (1-2 câu).`;
        const summary = await tryRequest(replyPrompt);
        const fullReply = `${content}`;
        utils.saveChat(currentHistoryFile, "bot", fullReply, mainKeyword, matchedFile);
        return res.json({ file: path.basename(matchedFile), keyword: mainKeyword, content: fullReply, historyFile: path.basename(currentHistoryFile) });
      }

      const noMatchPrompt = `Người dùng hỏi: "${userMessage}". Từ khóa: "${mainKeyword}". Không có tài liệu tương ứng. Hãy trả lời lịch sự rằng chủ đề này không nằm trong chương trình giảng dạy.`;
      const noMatch = await tryRequest(noMatchPrompt);
      utils.saveChat(currentHistoryFile, "bot", noMatch, mainKeyword);
      return res.json({ file: null, keyword: mainKeyword, content: noMatch, historyFile: path.basename(currentHistoryFile) });
    }

    const chatPrompt = `Người dùng nói: "${userMessage}". Hãy phản hồi thân thiện, vui vẻ, dễ hiểu (1-2 câu tiếng Việt).`;
    const reply = await tryRequest(chatPrompt);
    utils.saveChat(currentHistoryFile, "bot", reply);
    return res.json({ file: null, content: reply, historyFile: path.basename(currentHistoryFile) });

  } catch (err) {
    console.error("[SERVER ERR]⚠️ Lỗi xử lý:", err);
    const msg = "⚠️ Đã xảy ra lỗi khi xử lý yêu cầu.";
    utils.saveChat(currentHistoryFile, "bot", msg);
    res.status(500).json({ file: null, content: msg });
  }
});

// ===========================
// 🚀 Start server
// ===========================
app.listen(PORT, HOST, () => {
  console.log("[SERVER]✅ Server running at http://" + HOST + ":" + PORT);
  console.log(`[SERVER]🔑 Using ${apiKeys.length} API key [${apiKeys}]`);
});
