/**
 * Phân tích câu hỏi tiếng Việt để rút ra từ khóa chính (1–3 từ).
 * Nếu là thuật ngữ kỹ thuật → dịch sang tiếng Anh.
 * @param {object} model - model Gemini (GoogleGenerativeAI instance)
 * @param {string} text - Câu người dùng nhập
 * @param {Function} tryRequest - Hàm gọi AI có retry
 * @returns {Promise<string>} - Từ khóa chính (đã xử lý)
 */
module.exports = async function analyzeText(model, text, tryRequest) {
  const prompt = `
Phân tích câu hỏi tiếng Việt sau: "${text}"
→ Xác định nội dung chính hoặc khái niệm cốt lõi (1-3 danh từ).
→ Nếu là thuật ngữ kỹ thuật (Máy tính, sửa chữa máy tính, láp ráp cài đặt máy tính,...), dịch sang tiếng Anh.
→ Không giải thích, chỉ trả về cụm từ duy nhất (viết thường, không dấu ngoặc).
  `;

  try {
    const result = await tryRequest(prompt);
    return result.trim().toLowerCase().replace(/["']/g, "");
  } catch (err) {
    console.error("⚠️ Lỗi trong analyzeText:", err.message);
    return "unknown";
  }
};
