const express = require('express');
const ChatSession = require('../models/ChatSession');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const { authenticateToken } = require('../middleware/auth');
const { generateChatResponse } = require('../services/aiService');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Start new chat session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    const session = new ChatSession({
      user: req.user.userId,
      project: projectId || null,
      sessionId: uuidv4(),
      messages: [{
        role: 'assistant',
        content: `Hello! I'm your Agile Coach. I'm here to help you with project management, Kanban board optimization, and team coordination. ${project ? `I can see you're working on "${project.name}".` : ''} How can I assist you today?`,
        timestamp: new Date()
      }],
      context: {
        focusArea: 'general',
        lastActivity: new Date()
      }
    });

    await session.save();
    
    res.status(201).json(session);
  } catch (error) {
    logger.error('Create chat session error:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get chat sessions for user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ 
      user: req.user.userId,
      isActive: true 
    })
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json(sessions);
  } catch (error) {
    logger.error('Get chat sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get specific chat session
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      user: req.user.userId
    }).populate('project', 'name description')
      .populate('context.currentSprint', 'name startDate endDate');

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error('Get chat session error:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

// Send message to chat session
router.post('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { message, contextUpdate } = req.body;
    
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      user: req.user.userId
    }).populate('project')
      .populate('context.currentSprint');

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Update context if provided
    if (contextUpdate) {
      Object.assign(session.context, contextUpdate);
    }
    
    session.context.lastActivity = new Date();

    // Generate AI response
    try {
      // Prepare recent messages for context (last 10 messages)
      const recentMessages = session.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const aiResponse = await generateChatResponse(recentMessages, {
        project: session.project,
        currentSprint: session.context.currentSprint,
        focusArea: session.context.focusArea
      });

      // Add AI response
      session.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

    } catch (aiError) {
      logger.error('AI response error:', aiError);
      // Fallback response
      session.messages.push({
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing your request right now. Could you please rephrase or try again?',
        timestamp: new Date()
      });
    }

    // Keep only last 100 messages to manage memory
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100);
    }

    await session.save();
    
    // Return only the new messages
    const newMessages = session.messages.slice(-2);
    res.json({ messages: newMessages });
    
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update chat context (change focus area, current sprint, etc.)
router.put('/sessions/:sessionId/context', authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      user: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    Object.assign(session.context, req.body);
    session.context.lastActivity = new Date();
    
    await session.save();
    
    res.json({ message: 'Context updated successfully', context: session.context });
  } catch (error) {
    logger.error('Update chat context error:', error);
    res.status(500).json({ error: 'Failed to update context' });
  }
});

// Close chat session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      user: req.user.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    session.isActive = false;
    await session.save();
    
    res.json({ message: 'Chat session closed successfully' });
  } catch (error) {
    logger.error('Close chat session error:', error);
    res.status(500).json({ error: 'Failed to close chat session' });
  }
});

module.exports = router;