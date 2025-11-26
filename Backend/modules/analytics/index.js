// modules/analytics/index.js
const analyticsRoutes = require('./routes/analytics.routes');
const analyticsController = require('./controller/analytics.controller');
const analyticsService = require('./service/analytics.service');

module.exports = {
  routes: analyticsRoutes,
  controller: analyticsController,
  service: analyticsService
};
