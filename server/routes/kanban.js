const express = require('express');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');
const { analyzeIssueWithAI } = require('../services/aiService');
const logger = require('../config/logger');

const router = express.Router();

// Get Kanban board for project
router.get('/:projectId/board', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify user has access to project
    const project = await Project.findById(projectId)
      .populate('members.user', 'username avatarUrl skillLevel');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get issues grouped by status
    const issues = await Issue.find({ project: projectId })
      .populate('assignee', 'username avatarUrl skillLevel')
      .populate('reporter', 'username avatarUrl')
      .sort({ createdAt: -1 });
    
    const board = {
      columns: [
        { name: 'Backlog', status: 'backlog', issues: [] },
        { name: 'Ready', status: 'ready', issues: [] },
        { name: 'In Progress', status: 'in_progress', issues: [] },
        { name: 'Review', status: 'review', issues: [] },
        { name: 'Testing', status: 'testing', issues: [] },
        { name: 'Done', status: 'done', issues: [] }
      ]
    };
    
    // Group issues by status
    issues.forEach(issue => {
      const column = board.columns.find(col => col.status === issue.status);
      if (column) {
        column.issues.push(issue);
      }
    });
    
    res.json(board);
  } catch (error) {
    logger.error('Get Kanban board error:', error);
    res.status(500).json({ error: 'Failed to fetch Kanban board' });
  }
});

// Move issue to different column
router.put('/:projectId/issues/:issueId/move', authenticateToken, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;
    const { status, position } = req.body;
    
    const issue = await Issue.findOne({ _id: issueId, project: projectId });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const validStatuses = ['backlog', 'ready', 'in_progress', 'review', 'testing', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    issue.status = status;
    await issue.save();
    
    logger.info(`Issue ${issueId} moved to ${status} by user ${req.user.userId}`);
    
    res.json({ message: 'Issue moved successfully', issue });
  } catch (error) {
    logger.error('Move issue error:', error);
    res.status(500).json({ error: 'Failed to move issue' });
  }
});

// Create new issue
router.post('/:projectId/issues', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignee, priority, labels } = req.body;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const issue = new Issue({
      title,
      description,
      project: projectId,
      assignee,
      reporter: req.user.userId,
      priority,
      labels: labels || []
    });
    
    await issue.save();
    
    // Analyze issue with AI for suggestions
    try {
      const aiAnalysis = await analyzeIssueWithAI(issue);
      issue.aiAnalysis = aiAnalysis;
      await issue.save();
    } catch (aiError) {
      logger.warn('AI analysis failed:', aiError);
    }
    
    await issue.populate('assignee', 'username avatarUrl skillLevel');
    await issue.populate('reporter', 'username avatarUrl');
    
    logger.info(`New issue created: ${issue.title} in project ${projectId}`);
    
    res.status(201).json(issue);
  } catch (error) {
    logger.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update issue
router.put('/:projectId/issues/:issueId', authenticateToken, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;
    const updates = req.body;
    
    const issue = await Issue.findOneAndUpdate(
      { _id: issueId, project: projectId },
      updates,
      { new: true }
    ).populate('assignee', 'username avatarUrl skillLevel')
      .populate('reporter', 'username avatarUrl');
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json(issue);
  } catch (error) {
    logger.error('Update issue error:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Auto-analyze issues with AI
router.post('/:projectId/analyze', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const issues = await Issue.find({ 
      project: projectId,
      'aiAnalysis.lastAnalyzed': { $exists: false }
    });
    
    const analysisPromises = issues.map(async (issue) => {
      try {
        const aiAnalysis = await analyzeIssueWithAI(issue);
        issue.aiAnalysis = aiAnalysis;
        await issue.save();
        return { issueId: issue._id, status: 'success' };
      } catch (error) {
        logger.warn(`AI analysis failed for issue ${issue._id}:`, error);
        return { issueId: issue._id, status: 'failed', error: error.message };
      }
    });
    
    const results = await Promise.all(analysisPromises);
    
    res.json({
      message: 'AI analysis completed',
      results,
      processed: results.length
    });
  } catch (error) {
    logger.error('AI analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze issues' });
  }
});

module.exports = router;