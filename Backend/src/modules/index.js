// src/modules/index.js
// Central module loader for modular architecture

<<<<<<< HEAD
const authRbac = require('./auth-rbac');
const users = require('./users');
const surveys = require('./surveys');
const responses = require('./responses');
const templates = require('./templates');
const analytics = require('./analytics');
const exportModule = require('./export');
const collectors = require('./collectors');
const health = require('./health');
const notifications = require('./notifications');
const workspaces = require('./workspaces');
const llm = require('./llm');
const chat = require('./chat');
=======
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

// LLM module from local src/modules
const llm = require('./llm');
>>>>>>> linh2

module.exports = {
  authRbac,
  users,
  surveys,
  responses,
  templates,
  analytics,
  export: exportModule,
  collectors,
  health,
<<<<<<< HEAD
    notifications,
    workspaces,
    llm,
    chat
};
=======
  llm
};
>>>>>>> linh2
