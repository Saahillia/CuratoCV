/**
 * Developer context for platform/frontend/src/configs/api.js.
 * Purpose: configure Platform frontend api behavior.
 * Why here: common UI/service settings should remain centralized in Platform.
 */
import axios from 'axios';

const api = axios.create({
    baseURL:import.meta.env.VITE_BASE_URL,
})

export default api;