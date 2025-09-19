const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  githubRepo: {
    id: String,
    name: String,
    fullName: String,
    url: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sprints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  }],
  kanbanBoard: {
    columns: [{
      name: String,
      order: Number,
      wipLimit: Number
    }]
  },
  settings: {
    sprintDuration: {
      type: Number,
      default: 14 // days
    },
    estimationUnit: {
      type: String,
      enum: ['hours', 'points', 'days'],
      default: 'points'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  metrics: {
    totalIssues: {
      type: Number,
      default: 0
    },
    completedIssues: {
      type: Number,
      default: 0
    },
    averageCompletionTime: Number,
    velocity: [{
      sprint: String,
      points: Number,
      date: Date
    }]
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'archived'],
    default: 'planning'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);