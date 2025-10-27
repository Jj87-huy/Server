/**
 * Dịch đoạn văn giữa tiếng Việt ↔ tiếng Anh.
 * Nếu là tiếng Việt → dịch sang tiếng Anh, và ngược lại.
 * @param {object} model - model Gemini
 * @param {string} text - Văn bản cần dịch
 * @param {Function} tryRequest - Hàm gọi AI có retry
 * @returns {Promise<string>} - Bản dịch thuần túy
 */
module.exports = async function translateText(model, text, tryRequest) {
  const prompt = `
Phát hiện ngôn ngữ của văn bản sau và dịch sang ngôn ngữ còn lại (Việt ↔ Anh):
"${text}"
- Nếu là tiếng Việt → dịch sang tiếng Anh.
- Nếu là tiếng Anh → dịch sang tiếng Việt.
- Không chú thích, không ghi thêm mô tả, chỉ trả về bản dịch.
  `;

  try {
    const result = await tryRequest(prompt);
    return result.trim();
  } catch (err) {
    console.error("⚠️ Lỗi trong translateText:", err.message);
    return text;
  }
};
