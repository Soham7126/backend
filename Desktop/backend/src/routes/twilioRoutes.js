const express = require('express');
const {
  startCall,
  voice,
  respond,
} = require('../controllers/twilioController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected route for initiating calls
router.post('/start-call', protect, startCall);

// Twilio webhook routes (these need to be public for Twilio to access them)
// Handle both GET and POST for voice webhook
router.route('/twilio/voice')
  .get(voice)
  .post(voice);

// Handle both GET and POST for respond webhook
router.route('/twilio/respond')
  .get(respond)
  .post(respond);

module.exports = router;
