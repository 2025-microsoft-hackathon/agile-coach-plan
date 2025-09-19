const OpenAI = require('openai');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze an issue using AI to provide suggestions for size, priority, and complexity
 */
const analyzeIssueWithAI = async (issue) => {
  try {
    const prompt = `
Analyze this GitHub issue and provide recommendations:

Title: ${issue.title}
Description: ${issue.description || 'No description provided'}

Based on the title and description, provide analysis in the following JSON format:
{
  "suggestedSize": "xs|s|m|l|xl",
  "suggestedPriority": "low|medium|high|critical", 
  "estimatedDuration": 8,
  "complexity": "simple|moderate|complex|very_complex",
  "riskLevel": "low|medium|high",
  "tags": ["frontend", "backend", "bug", "feature", etc],
  "reasoning": "Brief explanation of the analysis"
}

Consider:
- Size: xs (1-2 hours), s (half day), m (1-2 days), l (3-5 days), xl (1+ week)
- Complexity based on technical requirements
- Risk based on dependencies and unknowns
- Appropriate tags for categorization
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Agile coach and software development estimator. Analyze issues and provide accurate estimations.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      ...analysis,
      lastAnalyzed: new Date()
    };
    
  } catch (error) {
    logger.error('AI analysis error:', error);
    throw new Error('Failed to analyze issue with AI');
  }
};

/**
 * Generate coaching suggestions based on project status
 */
const generateCoachingInsights = async (project, currentUser) => {
  try {
    const prompt = `
As an Agile coach, analyze this project status and provide insights:

Project: ${project.name}
Team size: ${project.members.length}
Sprint duration: ${project.settings.sprintDuration} days
Current status: ${project.status}
Total issues: ${project.metrics.totalIssues}
Completed issues: ${project.metrics.completedIssues}

Team skill levels:
${project.members.map(m => `- ${m.user.username}: ${m.skillLevel}`).join('\n')}

Provide coaching recommendations in JSON format:
{
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "risks": ["potential risk 1", "potential risk 2"],
  "nextActions": ["action 1", "action 2"],
  "teamBalance": "assessment of team skill balance",
  "suggestedFocus": "what the team should focus on"
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an experienced Agile coach helping teams improve their performance and collaboration.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content);
    
  } catch (error) {
    logger.error('Coaching insights error:', error);
    throw new Error('Failed to generate coaching insights');
  }
};

/**
 * Generate contextual chat response
 */
const generateChatResponse = async (messages, context) => {
  try {
    const systemMessage = `
You are an AI Agile Coach helping development teams with Kanban methodology. You have access to:
- Team composition (beginner, intermediate, advanced, expert developers)
- Project status and metrics  
- Current sprint information
- Issue tracking and burndown charts

Provide helpful, actionable advice in a friendly and professional tone. Always consider the team's skill levels when making suggestions.

Current context:
- Project: ${context.project?.name || 'Unknown'}
- Current Sprint: ${context.currentSprint?.name || 'None'}
- Focus Area: ${context.focusArea || 'general'}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
    
  } catch (error) {
    logger.error('Chat response error:', error);
    throw new Error('Failed to generate chat response');
  }
};

module.exports = {
  analyzeIssueWithAI,
  generateCoachingInsights,
  generateChatResponse
};