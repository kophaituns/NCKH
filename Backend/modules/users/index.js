// modules/users/index.js
// User management module
const userRoutes = require('./routes/user.routes');
const userController = require('./controller/user.controller');
const userService = require('./service/user.service');
const userRepository = require('./repository/user.repository');

module.exports = {
  routes: userRoutes,
  controller: userController,
  service: userService,
  repository: userRepository
};
