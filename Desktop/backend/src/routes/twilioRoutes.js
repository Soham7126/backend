const express = require('express');
const {
  startCall,
  voice,
  respond,
} = require('../controllers/twilioController');

const router = express.Router();

// Removed authentication for initiating calls
router.post('/start-call', startCall);

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
