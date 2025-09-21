const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const generateQuestion = async (req, res) => {
  const { history } = req.body;
  // Removed user ID requirement

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Determine if this is the initial question or a follow-up
    const isInitialQuestion = !history || history.length === 0;
    
    let prompt;
    if (isInitialQuestion) {
      // Initial multiple-choice question
      prompt = `You are a career guidance AI assistant. Generate an initial multiple-choice career assessment question.

The question should help understand the user's career interests, skills, and preferences. It should be engaging and comprehensive.

Your response MUST be formatted EXACTLY as a JSON object with this structure:
{
  "question": "your engaging career assessment question here",
  "options": ["option1", "option2", "option3", "option4", "option5", "option6"],
  "multipleChoice": true,
  "imageUrl": "https://example.com/career-assessment-image.jpg",
  "description": "Brief description of what this assessment measures"
}

Rules for the response:
1. The question should be clear, engaging, and career-focused
2. Provide EXACTLY 6 options for broader selection
3. Each option should be a distinct career interest or skill area
4. Set multipleChoice to true
5. Include a relevant image URL (use a placeholder if needed)
6. Include a brief description
7. Use professional, clear language
8. Ensure valid JSON format

Example of CORRECT format:
{
  "question": "Which of the following career areas interest you the most? (Select all that apply)",
  "options": [
    "Technology and Software Development",
    "Data Analysis and Research",
    "Creative Design and Media",
    "Business and Entrepreneurship",
    "Healthcare and Medicine",
    "Education and Training"
  ],
  "multipleChoice": true,
  "imageUrl": "https://example.com/career-paths.jpg",
  "description": "This assessment helps identify your primary career interests"
}

Generate the initial multiple-choice question following these rules exactly.`;
    } else {
      // Follow-up single-choice questions based on previous selections
      const lastAnswer = history[history.length - 1]?.answer || '';
      const questionCount = history.length; // Number of questions asked so far
      
      prompt = `You are a career guidance AI assistant. Generate follow-up career exploration questions based on the user's previous selections.

Previous selections: ${lastAnswer}
Questions asked so far: ${questionCount}
Total questions to ask: 10

Based on the user's selections: ${lastAnswer}

Generate question ${questionCount + 1} of 10. The question should be specific to their interests and help refine their career path.

Your response MUST be formatted EXACTLY as a JSON object with this structure:
{
  "question": "your specific follow-up question here",
  "options": ["option1", "option2", "option3", "option4"],
  "multipleChoice": false,
  "description": "Brief context for this question"
}

Rules for the response:
1. The question should be specific and relevant to their previous selections
2. Provide EXACTLY 4 options
3. Each option should be a meaningful response
4. Set multipleChoice to false
5. Include a brief description
6. Use professional, clear language
7. Ensure valid JSON format
8. Questions should progress logically (technical skills, experience, preferences, goals, etc.)

Example of CORRECT format:
{
  "question": "What is your current experience level in software development?",
  "options": [
    "Beginner - I've done some tutorials and small projects",
    "Intermediate - I have 1-2 years of experience",
    "Advanced - I have 3+ years of professional experience",
    "Expert - I have extensive experience and lead projects"
  ],
  "multipleChoice": false,
  "description": "Understanding your experience level helps tailor recommendations"
}

Generate question ${questionCount + 1} following these rules exactly.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Parse and validate the JSON response
    let parsedResult;
    try {
      // Clean the response text (remove potential markdown formatting)
      const cleanText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
      
      // Validate structure
      if (!parsedResult.question || !Array.isArray(parsedResult.options)) {
        throw new Error('Invalid response structure');
      }
      
      // Validate options
      if (parsedResult.options.some(option => typeof option !== 'string' || option.trim() === '')) {
        throw new Error('Invalid options format');
      }
      
      // Validate multipleChoice flag
      if (typeof parsedResult.multipleChoice !== 'boolean') {
        parsedResult.multipleChoice = isInitialQuestion;
      }
      
      // For initial question, ensure 6 options
      if (isInitialQuestion && parsedResult.options.length !== 6) {
        throw new Error('Initial question must have exactly 6 options');
      }
      
      // For follow-up, ensure 4 options
      if (!isInitialQuestion && parsedResult.options.length !== 4) {
        throw new Error('Follow-up question must have exactly 4 options');
      }
      
    } catch (parseError) {
      console.log('AI Response parsing failed:', parseError.message);
      console.log('Raw AI Response:', aiText);
      
      // Fallback structured response
      if (isInitialQuestion) {
        parsedResult = {
          question: "Which of the following career areas interest you the most? (Select all that apply)",
          options: [
            "Technology and Software Development",
            "Data Analysis and Research", 
            "Creative Design and Media",
            "Business and Entrepreneurship",
            "Healthcare and Medicine",
            "Education and Training"
          ],
          multipleChoice: true,
          imageUrl: "https://example.com/career-assessment.jpg",
          description: "This assessment helps identify your primary career interests"
        };
      } else {
        parsedResult = {
          question: "What is your current experience level in your areas of interest?",
          options: [
            "Beginner - I've done some tutorials and small projects",
            "Intermediate - I have 1-2 years of experience",
            "Advanced - I have 3+ years of professional experience",
            "Expert - I have extensive experience and lead projects"
          ],
          multipleChoice: false,
          description: "Understanding your experience level helps tailor recommendations"
        };
      }
    }

    // Update conversation history with better error handling
    try {
      await Conversation.findOneAndUpdate(
        { userId },
        { history, updatedAt: new Date() },
        { upsert: true, new: true, runValidators: true }
      );
      console.log('Conversation history updated successfully');
    } catch (conversationError) {
      console.log('Conversation update failed, but continuing:', conversationError.message);
      // Don't fail the entire request if conversation update fails
    }

    // Return the structured response
    res.json(parsedResult);
    
  } catch (error) {
    console.log('Generate question error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const generateRoadmaps = async (req, res) => {
  const { history } = req.body;
  // Removed user ID requirement

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a career guidance AI assistant. Generate career roadmaps that can be visualized using ReactFlow.

Based on conversation history: ${JSON.stringify(history)}

The response MUST be formatted EXACTLY as a JSON object with this structure:
{
  "roadmaps": [
    {
      "title": "Career Title",
      "description": "Brief description of the career path",
      "nodes": [
        {
          "id": "1",
          "type": "default",
          "position": { "x": 100, "y": 100 },
          "data": { "label": "Node Label" }
        }
        // ... more nodes
      ],
      "edges": [
        {
          "id": "e1-2",
          "source": "1",
          "target": "2"
        }
        // ... more edges
      ]
    }
    // ... more roadmaps
  ]
}

Rules for nodes and edges:
1. Nodes should represent key milestones, skills, or stages in the career path
2. Each node must have unique 'id' (string)
3. Node positions should flow from top to bottom (increase y value) and left to right (increase x value)
4. Edges should connect nodes in logical progression
5. Edge ids should be formatted as "e{sourceId}-{targetId}"
6. Position nodes with spacing of at least 100px between them
7. Create realistic career progression paths based on conversation history

Example of CORRECT format for one roadmap:
{
  "roadmaps": [{
    "title": "Data Scientist",
    "description": "A career path focusing on data analysis, machine learning, and statistical modeling",
    "nodes": [
      {
        "id": "1",
        "type": "default",
        "position": { "x": 250, "y": 0 },
        "data": { "label": "Bachelor's in Computer Science/Statistics" }
      },
      {
        "id": "2",
        "type": "default",
        "position": { "x": 250, "y": 100 },
        "data": { "label": "Learn Python & R" }
      },
      {
        "id": "3",
        "type": "default",
        "position": { "x": 100, "y": 200 },
        "data": { "label": "Machine Learning Fundamentals" }
      },
      {
        "id": "4",
        "type": "default",
        "position": { "x": 400, "y": 200 },
        "data": { "label": "Statistical Analysis" }
      },
      {
        "id": "5",
        "type": "default",
        "position": { "x": 250, "y": 300 },
        "data": { "label": "Build Portfolio Projects" }
      },
      {
        "id": "6",
        "type": "default",
        "position": { "x": 250, "y": 400 },
        "data": { "label": "Entry Level Data Scientist" }
      }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2" },
      { "id": "e2-3", "source": "2", "target": "3" },
      { "id": "e2-4", "source": "2", "target": "4" },
      { "id": "e3-5", "source": "3", "target": "5" },
      { "id": "e4-5", "source": "4", "target": "5" },
      { "id": "e5-6", "source": "5", "target": "6" }
    ]
  }]
}

Generate THREE career roadmaps following these rules exactly. Each roadmap should have:
1. A clear title and description
2. At least 6 nodes representing key milestones
3. Logical edges connecting the nodes
4. Node positions that create a clear visual flow
5. All required fields and proper JSON format
6. Career paths relevant to the conversation history or general career exploration if history is empty`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Parse and validate the JSON response
    let parsedResult;
    try {
      const cleanText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
      
      // Validate structure
      if (!Array.isArray(parsedResult.roadmaps)) {
        throw new Error('Invalid response format: roadmaps array missing');
      }
      
      // Validate each roadmap
      parsedResult.roadmaps.forEach((roadmap, index) => {
        if (!roadmap.title || !roadmap.description || !Array.isArray(roadmap.nodes) || !Array.isArray(roadmap.edges)) {
          throw new Error(`Invalid roadmap format at index ${index}`);
        }
        
        // Validate nodes
        roadmap.nodes.forEach(node => {
          if (!node.id || !node.type || !node.position || !node.data || !node.data.label) {
            throw new Error(`Invalid node format in roadmap ${roadmap.title}`);
          }
          if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            throw new Error(`Invalid node position in roadmap ${roadmap.title}`);
          }
        });
        
        // Validate edges
        roadmap.edges.forEach(edge => {
          if (!edge.id || !edge.source || !edge.target) {
            throw new Error(`Invalid edge format in roadmap ${roadmap.title}`);
          }
        });
      });
      
    } catch (parseError) {
      console.log('Roadmaps parsing failed:', parseError.message);
      console.log('Raw AI Response:', aiText);
      
      // Fallback structured ReactFlow-compatible response
      parsedResult = {
        roadmaps: [
          {
            title: "Software Developer",
            description: "A comprehensive path to becoming a skilled software developer",
            nodes: [
              {
                id: "1",
                type: "default",
                position: { x: 250, y: 0 },
                data: { label: "Learn Programming Fundamentals" }
              },
              {
                id: "2",
                type: "default",
                position: { x: 250, y: 100 },
                data: { label: "Choose Tech Stack" }
              },
              {
                id: "3",
                type: "default",
                position: { x: 100, y: 200 },
                data: { label: "Frontend Development" }
              },
              {
                id: "4",
                type: "default",
                position: { x: 400, y: 200 },
                data: { label: "Backend Development" }
              },
              {
                id: "5",
                type: "default",
                position: { x: 250, y: 300 },
                data: { label: "Build Portfolio Projects" }
              },
              {
                id: "6",
                type: "default",
                position: { x: 250, y: 400 },
                data: { label: "Apply for Junior Developer Roles" }
              }
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e2-4", source: "2", target: "4" },
              { id: "e3-5", source: "3", target: "5" },
              { id: "e4-5", source: "4", target: "5" },
              { id: "e5-6", source: "5", target: "6" }
            ]
          },
          {
            title: "Product Manager",
            description: "Path to becoming a strategic product manager",
            nodes: [
              {
                id: "1",
                type: "default",
                position: { x: 250, y: 0 },
                data: { label: "Understand Business Fundamentals" }
              },
              {
                id: "2",
                type: "default",
                position: { x: 250, y: 100 },
                data: { label: "Learn Product Management Tools" }
              },
              {
                id: "3",
                type: "default",
                position: { x: 100, y: 200 },
                data: { label: "User Research Skills" }
              },
              {
                id: "4",
                type: "default",
                position: { x: 400, y: 200 },
                data: { label: "Data Analysis Skills" }
              },
              {
                id: "5",
                type: "default",
                position: { x: 250, y: 300 },
                data: { label: "Build PM Portfolio" }
              },
              {
                id: "6",
                type: "default",
                position: { x: 250, y: 400 },
                data: { label: "Apply for Associate PM Roles" }
              }
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e2-4", source: "2", target: "4" },
              { id: "e3-5", source: "3", target: "5" },
              { id: "e4-5", source: "4", target: "5" },
              { id: "e5-6", source: "5", target: "6" }
            ]
          },
          {
            title: "Digital Marketing Specialist",
            description: "Comprehensive path to digital marketing expertise",
            nodes: [
              {
                id: "1",
                type: "default",
                position: { x: 250, y: 0 },
                data: { label: "Marketing Fundamentals" }
              },
              {
                id: "2",
                type: "default",
                position: { x: 250, y: 100 },
                data: { label: "Learn Digital Marketing Tools" }
              },
              {
                id: "3",
                type: "default",
                position: { x: 100, y: 200 },
                data: { label: "SEO & Content Marketing" }
              },
              {
                id: "4",
                type: "default",
                position: { x: 400, y: 200 },
                data: { label: "Social Media Marketing" }
              },
              {
                id: "5",
                type: "default",
                position: { x: 250, y: 300 },
                data: { label: "Create Marketing Campaigns" }
              },
              {
                id: "6",
                type: "default",
                position: { x: 250, y: 400 },
                data: { label: "Apply for Marketing Roles" }
              }
            ],
            edges: [
              { id: "e1-2", source: "1", target: "2" },
              { id: "e2-3", source: "2", target: "3" },
              { id: "e2-4", source: "2", target: "4" },
              { id: "e3-5", source: "3", target: "5" },
              { id: "e4-5", source: "4", target: "5" },
              { id: "e5-6", source: "5", target: "6" }
            ]
          }
        ]
      };
    }

    // Update conversation history with better error handling
    try {
      await Conversation.findOneAndUpdate(
        { userId },
        { history, updatedAt: new Date() },
        { upsert: true, new: true, runValidators: true }
      );
      console.log('Conversation history updated successfully');
    } catch (conversationError) {
      console.log('Conversation update failed, but continuing:', conversationError.message);
      // Don't fail the entire request if conversation update fails
    }

    // Return the roadmaps (not wrapped in another object)
    res.json(parsedResult);
    
  } catch (error) {
    console.log('Generate roadmaps error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const chatWithMentor = async (req, res) => {
  const { message, careerPath, context } = req.body;
  // Removed user ID requirement

  try {
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiResponse = await aiService.generateResponse(
      message,
      careerPath || 'general career advice',
      context || {}
    );

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
};

const getChatHistory = async (req, res) => {
  // Return empty history since we're not tracking users
  res.json({ messages: [] });
  return;

  try {
    const conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      return res.json({ messages: [] });
    }

    // Transform history to match expected format
    const messages = conversation.history.map(item => ({
      user: item.question,
      ai: item.answer,
      timestamp: item.timestamp
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = {
  generateQuestion,
  generateRoadmaps,
  chatWithMentor,
  getChatHistory,
};
