const express = require('express');
const router = express.Router();

// Webhook to handle call status updates
router.post('/status', (req, res) => {
  const callStatus = req.body.CallStatus;
  const callSid = req.body.CallSid;
  
  console.log(`Call ${callSid} status changed to ${callStatus}`);
  
  // You can update your CallLog model here
  // CallLog.findOneAndUpdate({ callSid }, { status: callStatus })
  
  res.sendStatus(200);
});

// Webhook to handle call recording if needed
router.post('/recording', (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;
  
  console.log(`Recording available for call ${callSid}: ${recordingUrl}`);
  res.sendStatus(200);
});

module.exports = router;