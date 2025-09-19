const express = require('express');
const Issue = require('../models/Issue');
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Get burndown chart data for sprint
router.get('/sprints/:sprintId/burndown', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId)
      .populate('project')
      .populate('issues');

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Verify access
    const project = sprint.project;
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate burndown data
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const issues = sprint.issues;
    const totalPoints = issues.reduce((sum, issue) => sum + (issue.estimation?.points || 0), 0);
    
    // Generate ideal burndown line
    const idealBurndown = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const remainingIdeal = totalPoints - (totalPoints * i / totalDays);
      idealBurndown.push({
        date: currentDate,
        remainingPoints: Math.max(0, remainingIdeal),
        type: 'ideal'
      });
    }

    // Get actual burndown from stored data
    const actualBurndown = sprint.burndown || [];
    
    res.json({
      sprintName: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalPoints,
      idealBurndown,
      actualBurndown,
      completionRate: sprint.metrics?.completionRate || 0
    });
    
  } catch (error) {
    logger.error('Get burndown chart error:', error);
    res.status(500).json({ error: 'Failed to fetch burndown data' });
  }
});

// Get burnup chart data for project
router.get('/projects/:projectId/burnup', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('sprints');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify access
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate cumulative burnup data
    const sprints = project.sprints.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    let cumulativeScope = 0;
    let cumulativeCompleted = 0;
    const burnupData = [];

    for (const sprint of sprints) {
      cumulativeScope += sprint.metrics?.plannedPoints || 0;
      cumulativeCompleted += sprint.metrics?.completedPoints || 0;
      
      burnupData.push({
        sprint: sprint.name,
        date: sprint.endDate,
        scope: cumulativeScope,
        completed: cumulativeCompleted,
        velocity: sprint.metrics?.velocity || 0
      });
    }

    res.json({
      projectName: project.name,
      burnupData,
      totalScope: cumulativeScope,
      totalCompleted: cumulativeCompleted,
      overallProgress: cumulativeScope > 0 ? (cumulativeCompleted / cumulativeScope) * 100 : 0
    });
    
  } catch (error) {
    logger.error('Get burnup chart error:', error);
    res.status(500).json({ error: 'Failed to fetch burnup data' });
  }
});

// Get project velocity metrics
router.get('/projects/:projectId/velocity', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('sprints');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify access
    const isMember = project.members.some(member => 
      member.user.toString() === req.user.userId
    );
    
    if (!isMember && project.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const completedSprints = project.sprints.filter(sprint => sprint.status === 'completed');
    const velocityData = completedSprints.map(sprint => ({
      sprint: sprint.name,
      velocity: sprint.metrics?.velocity || 0,
      plannedPoints: sprint.metrics?.plannedPoints || 0,
      completedPoints: sprint.metrics?.completedPoints || 0,
      completionRate: sprint.metrics?.completionRate || 0
    }));

    const averageVelocity = velocityData.length > 0 
      ? velocityData.reduce((sum, data) => sum + data.velocity, 0) / velocityData.length 
      : 0;

    res.json({
      velocityData,
      averageVelocity,
      sprintCount: velocityData.length,
      trend: calculateVelocityTrend(velocityData)
    });
    
  } catch (error) {
    logger.error('Get velocity metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch velocity data' });
  }
});

// Get team performance analytics
router.get('/projects/:projectId/team-performance', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'username skillLevel');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get issues for team performance analysis
    const issues = await Issue.find({ project: req.params.projectId })
      .populate('assignee', 'username skillLevel');

    const teamPerformance = project.members.map(member => {
      const memberIssues = issues.filter(issue => 
        issue.assignee && issue.assignee._id.toString() === member.user._id.toString()
      );
      
      const completedIssues = memberIssues.filter(issue => issue.status === 'done');
      const inProgressIssues = memberIssues.filter(issue => 
        ['in_progress', 'review', 'testing'].includes(issue.status)
      );

      const totalPoints = memberIssues.reduce((sum, issue) => 
        sum + (issue.estimation?.points || 0), 0
      );
      const completedPoints = completedIssues.reduce((sum, issue) => 
        sum + (issue.estimation?.points || 0), 0
      );

      return {
        user: member.user,
        skillLevel: member.skillLevel,
        totalIssues: memberIssues.length,
        completedIssues: completedIssues.length,
        inProgressIssues: inProgressIssues.length,
        totalPoints,
        completedPoints,
        completionRate: totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0,
        averageIssueSize: memberIssues.length > 0 ? totalPoints / memberIssues.length : 0
      };
    });

    res.json({
      teamPerformance,
      teamSize: project.members.length,
      skillDistribution: getSkillDistribution(project.members)
    });
    
  } catch (error) {
    logger.error('Get team performance error:', error);
    res.status(500).json({ error: 'Failed to fetch team performance data' });
  }
});

// Get issue metrics and trends
router.get('/projects/:projectId/issue-metrics', authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find({ project: req.params.projectId });
    
    // Calculate issue metrics
    const metrics = {
      total: issues.length,
      byStatus: {},
      byPriority: {},
      bySize: {},
      averageCompletionTime: 0,
      overdueIssues: 0
    };

    // Group by status
    issues.forEach(issue => {
      metrics.byStatus[issue.status] = (metrics.byStatus[issue.status] || 0) + 1;
      metrics.byPriority[issue.priority] = (metrics.byPriority[issue.priority] || 0) + 1;
      metrics.bySize[issue.size] = (metrics.bySize[issue.size] || 0) + 1;
    });

    // Calculate average completion time for done issues
    const completedIssues = issues.filter(issue => issue.status === 'done');
    if (completedIssues.length > 0) {
      const totalCompletionTime = completedIssues.reduce((sum, issue) => {
        const completionTime = new Date(issue.updatedAt) - new Date(issue.createdAt);
        return sum + completionTime;
      }, 0);
      metrics.averageCompletionTime = totalCompletionTime / completedIssues.length / (1000 * 60 * 60 * 24); // in days
    }

    res.json(metrics);
    
  } catch (error) {
    logger.error('Get issue metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch issue metrics' });
  }
});

// Helper function to calculate velocity trend
function calculateVelocityTrend(velocityData) {
  if (velocityData.length < 2) return 'stable';
  
  const recent = velocityData.slice(-3);
  const earlier = velocityData.slice(-6, -3);
  
  const recentAvg = recent.reduce((sum, data) => sum + data.velocity, 0) / recent.length;
  const earlierAvg = earlier.length > 0 
    ? earlier.reduce((sum, data) => sum + data.velocity, 0) / earlier.length 
    : recentAvg;
  
  const change = (recentAvg - earlierAvg) / earlierAvg;
  
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
}

// Helper function to get skill distribution
function getSkillDistribution(members) {
  const distribution = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
  members.forEach(member => {
    distribution[member.skillLevel] = (distribution[member.skillLevel] || 0) + 1;
  });
  return distribution;
}

module.exports = router;