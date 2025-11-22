// src/modules/llm-form-agent/index.js
// Form Agent AI module entry point
const routes = require('./routes/formAgent.routes');
const controller = require('./controller/formAgent.controller');
const service = require('./service/formAgent.service');

module.exports = {
  routes,
  controller,
  service
};
