// frontend/src/services/designService.js
import api from './api';

/**
 * POST /api/v1/customization/save/
 * payload: { name, config_json, total_price, preview_image_base64? }
 * Returns: { id, name, status, preview_image_url }
 */
export const saveDesign = async (payload) => {
  const response = await api.post('/customization/save/', payload);
  return response.data;
};

/**
 * GET /api/v1/customization/saved/
 * Returns array of CustomDesign objects for the current user.
 */
export const getSavedDesigns = async () => {
  const response = await api.get('/customization/saved/');
  return response.data;
};

/**
 * POST /api/v1/cart/custom/
 * Adds a saved custom design to the cart.
 */
export const addToCart = async (designId, quantity = 1) => {
  const response = await api.post('/cart/custom/', {
    custom_design_id: designId,
    quantity,
  });
  return response.data;
};
