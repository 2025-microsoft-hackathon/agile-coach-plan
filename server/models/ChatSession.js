const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  context: {
    currentSprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint'
    },
    focusArea: {
      type: String,
      enum: ['planning', 'execution', 'review', 'retrospective', 'general']
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-expire inactive sessions after 24 hours
chatSessionSchema.index({ 'context.lastActivity': 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);