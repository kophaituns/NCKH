// modules/index.js
// Central module loader for modular architecture

const authRbac = require('./auth-rbac');
const surveys = require('./surveys');
const responses = require('./responses');
const templates = require('./templates');
const analytics = require('./analytics');
const exportModule = require('./export');
const collectors = require('./collectors');
const chat = require('./chat');
const users = require('./users');
const llm = require('./llm');

module.exports = {
  authRbac,
  surveys,
  responses,
  templates,
  analytics,
  export: exportModule,
  collectors,
  chat,
  users,
  llm
};
