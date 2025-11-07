// src/modules/index.js
// Central module loader for modular architecture

const path = require('path');
const modulesPath = path.join(__dirname, '../../modules');

const authRbac = require(path.join(modulesPath, 'auth-rbac'));
const users = require(path.join(modulesPath, 'users'));
const surveys = require(path.join(modulesPath, 'surveys'));
const responses = require(path.join(modulesPath, 'responses'));
const templates = require(path.join(modulesPath, 'templates'));
const analytics = require(path.join(modulesPath, 'analytics'));
const exportModule = require(path.join(modulesPath, 'export'));
const collectors = require(path.join(modulesPath, 'collectors'));
const health = require(path.join(modulesPath, 'health'));

module.exports = {
  authRbac,
  users,
  surveys,
  responses,
  templates,
  analytics,
  export: exportModule,
  collectors,
  health
};
