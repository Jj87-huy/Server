const fs = require("fs");

function isQuestion(message) {
  const lower = message.toLowerCase();
  const questionWords = [
    "ai", "cái gì", "gì", "ở đâu", "khi nào",
    "làm sao", "như thế nào", "tại sao",
    "vì sao", "bao nhiêu", "mấy", "cách", "?", "sao"
  ];
  return questionWords.some(word => lower.includes(word)) || lower.endsWith("?");
}

function sanitizeFileName(text) {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function saveChat(historyFile, role, message, keyword = null, file = null) {
  const log = {
    time: new Date().toLocaleString("vi-VN"),
    role,
    message,
    keyword,
    file
  };
  let history = [];
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, "utf8"));
    } catch {
      history = [];
    }
  }
  history.push(log);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");
}

module.exports = { isQuestion, sanitizeFileName, saveChat };
