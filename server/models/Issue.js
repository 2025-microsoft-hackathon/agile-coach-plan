const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  githubId: String,
  number: Number,
  title: {
    type: String,
    required: true
  },
  description: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['backlog', 'ready', 'in_progress', 'review', 'testing', 'done'],
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  size: {
    type: String,
    enum: ['xs', 's', 'm', 'l', 'xl'],
    default: 'm'
  },
  estimation: {
    points: Number,
    hours: Number,
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  labels: [String],
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  dependencies: [{
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'relates_to']
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiAnalysis: {
    suggestedSize: String,
    suggestedPriority: String,
    estimatedDuration: Number,
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex', 'very_complex']
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    tags: [String],
    lastAnalyzed: Date
  },
  timeTracking: {
    timeSpent: Number,
    timeRemaining: Number,
    logEntries: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      duration: Number,
      description: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Index for efficient queries
issueSchema.index({ project: 1, status: 1 });
issueSchema.index({ assignee: 1, status: 1 });

module.exports = mongoose.model('Issue', issueSchema);