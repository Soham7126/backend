const express = require('express');
const {
  generateQuestion,
  generateRoadmaps,
  chatWithMentor,
  getChatHistory,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate-question', protect, generateQuestion);
router.post('/generate-roadmaps', protect, generateRoadmaps);
router.post('/chat', protect, chatWithMentor);
router.get('/chat', protect, getChatHistory);

module.exports = router;
