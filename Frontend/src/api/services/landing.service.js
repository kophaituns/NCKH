// src/api/services/landing.service.js
import axios from 'axios';

// Use absolute URL since the public landing endpoint is NOT under /api/modules
const API_BASE = 'http://localhost:5000';

const LandingService = {
    /**
     * Get public landing page data (stats and featured templates)
     * @returns {Promise<{ok: boolean, stats: Object, featuredTemplates: Array, error?: string}>}
     */
    async getLandingData() {
        try {
            // Use absolute URL to bypass the /api/modules base path
            const response = await axios.get(`${API_BASE}/api/public/landing`);
            const responseData = response.data || {};
            const { success, data } = responseData;

            if (success && data) {
                return {
                    ok: true,
                    stats: data.stats || { totalSurveys: 0, aiQuestions: 0 },
                    featuredTemplates: data.featuredTemplates || []
                };
            }

            return {
                ok: false,
                stats: { totalSurveys: 0, aiQuestions: 0 },
                featuredTemplates: [],
                error: responseData.message || 'Failed to fetch landing data'
            };
        } catch (error) {
            console.error('[LandingService.getLandingData] ERROR:', error.message);
            return {
                ok: false,
                stats: { totalSurveys: 0, aiQuestions: 0 },
                featuredTemplates: [],
                error: error.response?.data?.message || error.message || 'Failed to fetch landing data'
            };
        }
    }
};

export default LandingService;

