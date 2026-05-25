// frontend/src/services/aiGeneratorService.js
import api from './api';

/**
 * POST /api/v1/configurator/generate/
 * @param {string} prompt      - Natural-language design description
 * @param {number|null} categoryId - Optional jewelry category ID
 * @returns {Promise<{beads, chain, charms, color, material, total_price, config_json}>}
 */
const generateDesign = async (prompt, categoryId = null) => {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt is required');
  }

  const payload = { prompt: prompt.trim() };
  if (categoryId != null) {
    payload.category_id = categoryId;
  }

  const response = await api.post('/configurator/generate/', payload);
  return response.data;
};

/**
 * POST /api/v1/configurator/analyze-image/
 * Upload a bead/bracelet photo; backend returns matched beads + detected color.
 * @param {File} imageFile - The image file from an <input type="file">
 * @returns {Promise<{beads, color, detected_style, detected_hex}>}
 */
export const analyzeBeadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await api.post('/configurator/analyze-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default generateDesign;
