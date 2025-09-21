const twilio = require("twilio");
const CallLog = require("../models/CallLog");
const Todo = require("../models/Todo");
const aiService = require("../services/aiService");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function for handling responses
const handleNoInputCase = (twiml, turnCount, careerPath, userId) => {
  twiml.say(
    {
      voice: "Polly.Amy-Neural",
    },
    "I'm having trouble hearing you clearly. Could you please try again?"
  );

  const gather = twiml.gather({
    input: "speech",
    action: `/api/twilio/respond?turn=${turnCount}&careerPath=${encodeURIComponent(
      careerPath || ""
    )}&userId=${userId}`,
    method: "POST",
    speechTimeout: "auto",
    language: "en-US",
  });

  gather.say(
    {
      voice: "Polly.Amy-Neural",
    },
    "Please share your thoughts with me."
  );
};

// Handle the respond webhook
const respond = async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    console.log("Respond webhook called");
    console.log("Query params:", req.query);
    console.log("Body:", req.body);

    // Extract speech result from various possible locations
    const speechResult =
      req.body?.SpeechResult ||
      req.body?.speech_result ||
      req.body?.Transcript ||
      req.body?.transcript ||
      "";

    console.log("Extracted speech result:", speechResult);

    // Check for valid input
    const hasInput = Boolean(
      req.body &&
        ("SpeechResult" in req.body ||
          "speech_result" in req.body ||
          "Transcript" in req.body ||
          "transcript" in req.body)
    );

    const turnCount = parseInt(req.query.turn || req.body.turn || "0", 10);
    const careerPath =
      req.query.careerPath || req.body.careerPath || "your chosen field";

    if (hasInput && speechResult) {
      // Generate AI response based on the speech input
      const turnCount = parseInt(req.query.turn || req.body.turn || "0", 10);
      const careerPath =
        req.query.careerPath || req.body.careerPath || "your chosen field";

      const context = {
        turnCount,
        previousResponses: req.body.previousResponses || [],
        careerPath,
      };

      const aiResponse = await aiService.generateResponse(
        speechResult,
        careerPath,
        context
      );
      const mainResponse = aiResponse.split("?")[0];
      const followUpQuestion = aiResponse.includes("?")
        ? aiResponse.split("?")[1].trim() + "?"
        : "What are your thoughts on that?";

      // Accumulate conversation history
      const conversationHistory = [
        ...(req.body.conversationHistory || []),
        {
          userInput: speechResult,
          aiResponse: mainResponse,
          turn: turnCount,
          timestamp: new Date(),
        },
      ];

      // Deliver the AI response
      twiml.say({ voice: "Polly.Amy-Neural" }, mainResponse);
      twiml.pause({ length: 1 });

      if (turnCount >= 4) {
        // End conversation with advice
        const closingResponse = await aiService.generateAdvice(
          careerPath,
          "next steps"
        );
        twiml.say({ voice: "Polly.Amy-Neural" }, closingResponse);
        twiml.say(
          {
            voice: "Polly.Amy-Neural",
          },
          "Thank you for this valuable conversation. I wish you the best in your career journey!"
        );

        // Generate todos based on conversation
        try {
          console.log("Generating todos from conversation...");
          const generatedTodos = await aiService.generateTodosFromConversation(
            conversationHistory,
            careerPath
          );

          // Save todos to database
          const userId = req.query.userId || req.body.userId; // Get from query params or body
          if (userId && generatedTodos.length > 0) {
            const todoPromises = generatedTodos.map(todoData =>
              new Todo({
                userId,
                title: todoData.title,
                description: todoData.description,
                status: 'not-started',
                source: 'conversation',
                priority: todoData.priority || 'medium',
              }).save()
            );

            await Promise.all(todoPromises);
            console.log(`Generated and saved ${generatedTodos.length} conversation-based todos for user ${userId}`);
          }
        } catch (error) {
          console.error("Error generating todos:", error);
        }

        twiml.hangup();
      } else {
        // Continue conversation
        const gather = twiml.gather({
          input: "speech",
          action: `/api/twilio/respond?turn=${
            turnCount + 1
          }&careerPath=${encodeURIComponent(careerPath)}&userId=${req.query.userId || req.body.userId}`,
          method: "POST",
          speechTimeout: "auto",
          language: "en-US",
        });

        // Pass conversation history to next turn
        gather.say({ voice: "Polly.Amy-Neural" }, followUpQuestion);
      }
    } else {
      // Handle no input case
      handleNoInputCase(twiml, turnCount, careerPath, req.query.userId || req.body.userId);
    }

    console.log("Generated response TwiML:", twiml.toString());
    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error in respond webhook:", error);
    twiml.say(
      {
        voice: "Polly.Amy-Neural",
      },
      "I apologize, but I'm having some trouble. Let's try again."
    );

    const gather = twiml.gather({
      input: "speech",
      action: `/api/twilio/respond?turn=${
        req.query.turn || "0"
      }&careerPath=${encodeURIComponent(req.query.careerPath || "")}&userId=${req.query.userId || req.body.userId}`,
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    });

    gather.say(
      {
        voice: "Polly.Amy-Neural",
      },
      "Please share your thoughts with me."
    );

    res.type("text/xml");
    res.send(twiml.toString());
  }
};

// Handle the initial voice webhook
const voice = async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const careerPath = req.query.careerPath || req.body.careerPath;
    const userId = req.query.userId || req.body.userId;
    console.log("Voice webhook called with career path:", careerPath, "userId:", userId);

    if (!careerPath) {
      throw new Error("Career path is required");
    }

    // Generate AI-powered greeting
    const greeting = await aiService.generateGreeting(careerPath);
    twiml.say({ voice: "Polly.Amy-Neural" }, greeting);
    twiml.pause({ length: 1 });

    const gather = twiml.gather({
      input: "speech",
      action: `/api/twilio/respond?careerPath=${encodeURIComponent(
        careerPath
      )}&turn=0&userId=${userId}`,
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    });

    gather.say(
      {
        voice: "Polly.Amy-Neural",
      },
      "What aspects of this field interest you the most? Feel free to share your thoughts."
    );
  } catch (error) {
    console.error("Error in voice webhook:", error);
    twiml.say(
      {
        voice: "Polly.Amy-Neural",
      },
      "I apologize, but I'm having trouble connecting right now. Please try again in a few moments."
    );
  }

  res.type("text/xml");
  res.send(twiml.toString());
};

// Handle starting a new call
const startCall = async (req, res) => {
  try {
    console.log("Starting Twilio call...");
    console.log("Request body:", req.body);
    console.log("User ID:", req.user?.id);

    const { toPhoneNumber, phoneNumber, careerPath } = req.body;
    const userId = req.user.id;
    const finalPhoneNumber = toPhoneNumber || phoneNumber;

    if (!finalPhoneNumber) {
      return res.status(400).json({
        error:
          "Phone number is required (as either phoneNumber or toPhoneNumber)",
      });
    }

    if (!process.env.BASE_URL) {
      console.error("BASE_URL environment variable is not set");
      return res
        .status(500)
        .json({ error: "Server configuration error: BASE_URL not set" });
    }

    console.log("Creating call with Twilio...");

    const verifiedNumbers = await client.outgoingCallerIds.list();
    const isVerified = verifiedNumbers.some(
      (v) => v.phoneNumber === finalPhoneNumber
    );

    if (!isVerified) {
      const verification = await client.validationRequests.create({
        friendlyName: "Career Mentor User",
        phoneNumber: finalPhoneNumber,
      });

      return res.status(400).json({
        error: "Phone number needs verification",
        details:
          "We are sending you a verification code. Please verify your number in the Twilio console.",
        verificationSid: verification.sid,
      });
    }

    const call = await client.calls.create({
      to: finalPhoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${
        process.env.BASE_URL
      }/api/twilio/voice?careerPath=${encodeURIComponent(careerPath || "")}&userId=${userId}`,
    });

    console.log("Call created successfully:", call.sid);

    const callLog = new CallLog({
      userId,
      callSid: call.sid,
      to: finalPhoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      status: "initiated",
      careerPath: careerPath || "General Career Advice",
    });

    await callLog.save();
    console.log("Call log saved:", callLog._id);

    res.json({
      success: true,
      callSid: call.sid,
      message: "Call initiated successfully",
    });
  } catch (error) {
    console.error("Error starting call:", error);
    res.status(500).json({
      error: "Failed to start call",
      details: error.message,
    });
  }
};

// Export handlers
module.exports = {
  startCall,
  voice,
  respond,
};
