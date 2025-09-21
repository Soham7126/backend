const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate initial greeting
   */
  async generateGreeting(careerPath) {
    const prompt = `
    Generate a warm, professional greeting for someone interested in ${careerPath}.
    Keep it brief (2-3 sentences) and end with a question about their interest in this field.
    Response should be conversational and engaging.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generate response to user's input
   */
  async generateResponse(userInput, careerPath, context = {}) {
    const prompt = `
    You are a career mentor specializing in ${careerPath}.
    The user said: "${userInput}"
    
    Previous context: ${JSON.stringify(context)}
    
    Generate a natural, helpful response that:
    1. Acknowledges their input
    2. Provides relevant insights or guidance
    3. Asks a follow-up question to deepen the conversation
    
    Keep the response concise and conversational.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generate career advice
   */
  async generateAdvice(careerPath, topic) {
    const prompt = `
    Provide specific advice about ${topic} for someone pursuing a career in ${careerPath}.
    Focus on practical, actionable guidance.
    Keep it brief and end with a question about their thoughts on the advice.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generate todo list based on conversation
   */
  async generateTodosFromConversation(conversationHistory, careerPath) {
    const prompt = `
    Based on this career mentoring conversation, generate a list of actionable todo items for the user.

    Conversation History:
    ${JSON.stringify(conversationHistory)}

    Career Path: ${careerPath}

    Generate 3-5 specific, actionable todo items that the user should complete to advance their career in ${careerPath}.
    Each todo should be:
    - Specific and measurable
    - Related to the conversation topics discussed
    - Achievable in a reasonable timeframe
    - Relevant to their career goals

    Format the response as a JSON array of objects:
    [
      {
        "title": "Short, clear title",
        "description": "Detailed description of what to do and why",
        "priority": "high|medium|low"
      }
    ]

    Focus on practical steps like skill development, networking, project work, or learning activities.
    `;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    try {
      // Clean the response and parse JSON
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const todos = JSON.parse(cleanResponse);

      // Validate the structure
      if (Array.isArray(todos) && todos.every(todo =>
        todo.title && todo.description && ['high', 'medium', 'low'].includes(todo.priority)
      )) {
        return todos;
      } else {
        throw new Error('Invalid todo format');
      }
    } catch (error) {
      console.error('Error parsing AI-generated todos:', error);
      // Fallback todos
      return [
        {
          title: "Research career opportunities in " + careerPath,
          description: "Explore job listings, salary ranges, and growth prospects in your chosen field",
          priority: "high"
        },
        {
          title: "Identify key skills to develop",
          description: "Based on our conversation, focus on learning the most important skills for " + careerPath,
          priority: "high"
        },
        {
          title: "Create a learning plan",
          description: "Outline specific steps and resources for skill development",
          priority: "medium"
        }
      ];
    }
  }
}

module.exports = new AIService();