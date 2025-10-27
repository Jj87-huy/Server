const fs = require("fs");
const path = require("path");

const HISTORY_DIR = "./chat_history";

if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR);

function listHistoryFiles() {
  return fs.readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(HISTORY_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
}

function readHistoryFile(fileName) {
  const filePath = path.join(HISTORY_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
}

module.exports = { listHistoryFiles, readHistoryFile, HISTORY_DIR };
