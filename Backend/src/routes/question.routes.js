// src/routes/question.routes.js
const express = require('express');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth.middleware');
const router = express.Router();

// Tạm thời sử dụng controller giả (placeholder)
const questionController = {
  createQuestion: (req, res) => {
    res.status(200).json({ message: 'Question creation endpoint (placeholder)' });
  },
  getQuestions: (req, res) => {
    res.status(200).json({ message: 'Get questions endpoint (placeholder)' });
  },
  getQuestionById: (req, res) => {
    res.status(200).json({ message: 'Get question by ID endpoint (placeholder)' });
  },
  updateQuestion: (req, res) => {
    res.status(200).json({ message: 'Update question endpoint (placeholder)' });
  },
  deleteQuestion: (req, res) => {
    res.status(200).json({ message: 'Delete question endpoint (placeholder)' });
  }
};

// Routes for question management
router.post('/', authenticate, isTeacherOrAdmin, questionController.createQuestion);
router.get('/', authenticate, isTeacherOrAdmin, questionController.getQuestions);
router.get('/:id', authenticate, isTeacherOrAdmin, questionController.getQuestionById);
router.put('/:id', authenticate, isTeacherOrAdmin, questionController.updateQuestion);
router.delete('/:id', authenticate, isTeacherOrAdmin, questionController.deleteQuestion);

module.exports = router;
