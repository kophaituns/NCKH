// src/modules/llm/index.js
const routes = require('./routes/llm.routes');
const controller = require('./controller/llm.controller');
const service = require('./service/llm.service');

module.exports = {
  routes,
  controller,
  service
};
