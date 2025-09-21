const twilio = require('twilio');

class TwiMLBuilder {
  constructor() {
    this.response = new twilio.twiml.VoiceResponse();
  }

  /**
   * Add speech with proper voice and pauses
   */
  addSpeech(text, options = {}) {
    const {
      voice = 'Polly.Amy-Neural',
      beforePause = 1,
      afterPause = 1
    } = options;

    if (beforePause) {
      this.response.pause({ length: beforePause });
    }

    this.response.say({ voice }, text);

    if (afterPause) {
      this.response.pause({ length: afterPause });
    }

    return this;
  }

  /**
   * Add speech input gathering
   */
  addGather(options = {}) {
    const {
      action = '/api/respond',
      timeout = 'auto',
      prompt = 'Please tell me more about that.'
    } = options;

    const gather = this.response.gather({
      input: 'speech',
      action,
      speechTimeout: timeout
    });

    gather.say({ voice: 'Polly.Amy-Neural' }, prompt);
    return this;
  }

  /**
   * Add a hangup or redirect
   */
  endCall(options = {}) {
    const { hangup = true, redirect = null } = options;
    
    if (redirect) {
      this.response.redirect(redirect);
    } else if (hangup) {
      this.response.hangup();
    }
    
    return this;
  }

  /**
   * Get the final TwiML
   */
  build() {
    return this.response.toString();
  }
}

module.exports = TwiMLBuilder;