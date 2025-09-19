const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  goal: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  issues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],
  capacity: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hoursPerDay: Number,
    daysAvailable: Number,
    totalCapacity: Number
  }],
  burndown: [{
    date: Date,
    remainingPoints: Number,
    remainingIssues: Number,
    completedPoints: Number
  }],
  metrics: {
    plannedPoints: Number,
    completedPoints: Number,
    velocity: Number,
    completionRate: Number
  },
  retrospective: {
    whatWentWell: [String],
    whatCouldImprove: [String],
    actionItems: [{
      description: String,
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sprint', sprintSchema);