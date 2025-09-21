const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callSid: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  careerPath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'completed', 'failed'],
    default: 'initiated'
  },
  duration: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
callLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CallLog = mongoose.model('CallLog', callLogSchema);

module.exports = CallLog;