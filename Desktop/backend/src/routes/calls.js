const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { initiateCall, generateVoiceResponse } = require('../services/twilio');
const CallLog = require('../models/CallLog');

// POST /api/calls/start
router.post('/start', auth, async (req, res) => {
  try {
    const { phoneNumber, careerPath } = req.body;

    // Create call log
    const callLog = new CallLog({
      userId: req.user._id,
      phoneNumber,
      careerPath,
      status: 'initiated'
    });
    await callLog.save();

    // Initiate call
    const call = await initiateCall(phoneNumber, careerPath);

    // Update call log with call SID
    callLog.callSid = call.sid;
    await callLog.save();

    res.json({
      message: 'Call initiated successfully',
      callId: callLog._id
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Error initiating call' });
  }
});

// POST /api/calls/voice
router.post('/voice', async (req, res) => {
  try {
    const { careerPath } = req.query;
    const twiml = await generateVoiceResponse(careerPath);
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error generating voice response:', error);
    res.status(500).json({ message: 'Error generating voice response' });
  }
});

// POST /api/calls/respond
router.post('/respond', async (req, res) => {
  try {
    const { careerPath } = req.query;
    const { SpeechResult } = req.body;
    
    const twiml = await generateVoiceResponse(careerPath, SpeechResult);
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ message: 'Error generating response' });
  }
});

// POST /api/calls/status
router.post('/status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;

    // Update call log
    const callLog = await CallLog.findOne({ callSid: CallSid });
    if (callLog) {
      callLog.status = CallStatus === 'completed' ? 'completed' : 'failed';
      callLog.duration = CallDuration;
      await callLog.save();
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ message: 'Error updating call status' });
  }
});

// GET /api/calls/logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await CallLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({ message: 'Error fetching call logs' });
  }
});

module.exports = router;