const fs = require("fs");
const path = require("path");

const DATA_PATH = "./data";

function getAllTextFiles(dir = DATA_PATH, basePath = DATA_PATH) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllTextFiles(filePath, basePath));
    } else if (file.endsWith(".txt")) {
      results.push(path.relative(basePath, filePath));
    }
  }
  return results;
}

function findMatchingFile(keyword) {
  if (!keyword) return null;
  const files = getAllTextFiles();
  const msg = keyword.toLowerCase();

  for (const file of files) {
    const name = path.basename(file, ".txt").toLowerCase();
    if (name === msg || name.includes(msg) || msg.includes(name)) {
      return path.join(DATA_PATH, file);
    }
  }
  return null;
}

module.exports = { findMatchingFile };
