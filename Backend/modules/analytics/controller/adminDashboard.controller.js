// Backend/modules/analytics/controllers/adminDashboard.controller.js
const adminDashboardService = require('../services/adminDashboard.service');

async function getAdminDashboard(req, res, next) {
  try {
    const data = await adminDashboardService.getAdminDashboard();
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error in getAdminDashboard:', err);
    return next(err);
  }
}

module.exports = {
  getAdminDashboard,
};
