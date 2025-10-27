const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = function setupGemini(apiKeys) {
  let currentKeyIndex = 0;

  function getCurrentKey() {
    return apiKeys[currentKeyIndex];
  }

  function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`🔄 Đổi sang API key khác (${currentKeyIndex + 1}/${apiKeys.length})`);
  }

  function createModel() {
    const key = getCurrentKey();
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  let model = createModel();

  async function tryRequest(prompt, retry = true) {
    try {
      const response = await model.generateContent(prompt);
      return response.response.text();
    } catch (err) {
      console.error("❌ Lỗi Gemini:", err.message);
      if (retry && apiKeys.length > 1) {
        rotateKey();
        model = createModel();
        return tryRequest(prompt, false);
      }
      throw err;
    }
  }

  return { tryRequest, createModel, rotateKey, getCurrentKey, model };
};
