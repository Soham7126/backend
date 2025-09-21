const express = require('express');
const {
  generateQuestion,
  generateRoadmaps,
  chatWithMentor,
  getChatHistory,
} = require('../controllers/aiController');

const router = express.Router();

router.post('/generate-question', generateQuestion);
router.post('/generate-roadmaps', generateRoadmaps);
router.post('/chat', chatWithMentor);
router.get('/chat', getChatHistory);

module.exports = router;
