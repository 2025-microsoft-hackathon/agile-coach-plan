const express = require('express');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const Sprint = require('../models/Sprint');
const { authenticateToken } = require('../middleware/auth');
const { fetchGitHubRepos, fetchGitHubOrganizations } = require('../services/githubService');
const { generateCoachingInsights } = require('../services/aiService');
const logger = require('../config/logger');

const router = express.Router();

// Get user's projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    }).populate('owner', 'username avatarUrl')
      .populate('members.user', 'username avatarUrl skillLevel')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, githubRepo, members } = req.body;
    
    const project = new Project({
      name,
      description,
      githubRepo,
      owner: req.user.userId,
      members: members || [],
      kanbanBoard: {
        columns: [
          { name: 'Backlog', order: 0, wipLimit: null },
          { name: 'Ready', order: 1, wipLimit: 3 },
          { name: 'In Progress', order: 2, wipLimit: 4 },
          { name: 'Review', order: 3, wipLimit: 2 },
          { name: 'Testing', order: 4, wipLimit: 2 },
          { name: 'Done', order: 5, wipLimit: null }
        ]
      }
    });

    await project.save();
    
    // Add owner as a member
    project.members.push({
      user: req.user.userId,
      role: 'owner',
      skillLevel: req.userObj.skillLevel || 'intermediate'
    });
    
    await project.save();
    await project.populate('owner', 'username avatarUrl');
    await project.populate('members.user', 'username avatarUrl skillLevel');

    logger.info(`New project created: ${project.name} by ${req.userObj.username}`);
    
    res.status(201).json(project);
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username avatarUrl')
      .populate('members.user', 'username avatarUrl skillLevel')
      .populate('sprints');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user.userId
    );
    
    if (!isMember && project.owner._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user.userId;
    const isAdmin = project.members.some(member => 
      member.user.toString() === req.user.userId && member.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(project, req.body);
    await project.save();

    await project.populate('owner', 'username avatarUrl');
    await project.populate('members.user', 'username avatarUrl skillLevel');

    res.json(project);
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Get project insights from AI coach
router.get('/:id/insights', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'username skillLevel');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const insights = await generateCoachingInsights(project, req.userObj);
    
    res.json(insights);
  } catch (error) {
    logger.error('Get project insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Add team member to project  
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId, role, skillLevel } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user.userId;
    if (!isOwner) {
      return res.status(403).json({ error: 'Only project owner can add members' });
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(member => 
      member.user.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ error: 'User is already a project member' });
    }

    project.members.push({
      user: userId,
      role: role || 'member',
      skillLevel: skillLevel || 'intermediate'
    });

    await project.save();
    await project.populate('members.user', 'username avatarUrl skillLevel');

    res.json(project);
  } catch (error) {
    logger.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Sync with GitHub repository
router.post('/:id/sync-github', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.githubRepo) {
      return res.status(400).json({ error: 'No GitHub repository linked' });
    }

    // This would integrate with GitHub API to sync issues
    // Implementation would depend on specific GitHub API integration needs
    
    res.json({ message: 'GitHub sync initiated', status: 'success' });
  } catch (error) {
    logger.error('GitHub sync error:', error);
    res.status(500).json({ error: 'Failed to sync with GitHub' });
  }
});

module.exports = router;