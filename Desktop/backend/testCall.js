const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function makeTestCall() {
  try {
    const call = await client.calls.create({
      to: "+19347324902",  // Replace with your phone number to test
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `<Response><Say>Hello! This is a test call from your Twilio integration.</Say></Response>`
    });
    
    console.log("Call initiated with SID:", call.sid);
  } catch (error) {
    console.error("Error making call:", error.message);
  }
}

makeTestCall();
