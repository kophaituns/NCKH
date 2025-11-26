<<<<<<< HEAD
// modules/llm/index.js
const llmRoutes = require('./routes/llm.routes');

module.exports = {
    routes: llmRoutes,
    name: 'llm',
    version: '1.0.0',
    description: 'LLM/AI module for question generation and survey assistance'
};
=======
// src/modules/llm/index.js
const routes = require('./routes/llm.routes');
const controller = require('./controller/llm.controller');
const service = require('./service/llm.service');

module.exports = {
  routes,
  controller,
  service
};
>>>>>>> linh2
