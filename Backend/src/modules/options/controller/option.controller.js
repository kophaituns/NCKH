// src/modules/options/controller/option.controller.js
const optionService = require('../service/option.service');
const logger = require('../../../utils/logger');

class OptionController {
  /**
   * Update option
   */
  async updateOption(req, res) {
    try {
      const { id } = req.params;
      const optionData = req.body;
      const userId = req.user.id;

      const updatedOption = await optionService.updateOption(id, optionData, userId);

      res.json({
        success: true,
        data: updatedOption
      });
    } catch (error) {
      logger.error('Error updating option:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete option
   */
  async deleteOption(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await optionService.deleteOption(id, userId);

      res.json({
        success: true,
        message: 'Option deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting option:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Add option to question
   */
  async addOption(req, res) {
    try {
      const optionData = req.body;
      const userId = req.user.id;

      const newOption = await optionService.addOption(optionData, userId);

      res.status(201).json({
        success: true,
        data: newOption
      });
    } catch (error) {
      logger.error('Error adding option:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new OptionController();