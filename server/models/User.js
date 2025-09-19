const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  email: String,
  avatarUrl: String,
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  organizations: [{
    id: String,
    login: String,
    role: String
  }],
  repositories: [{
    id: String,
    name: String,
    fullName: String,
    private: Boolean
  }],
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);