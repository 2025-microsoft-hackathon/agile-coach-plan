const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const router = express.Router();

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    
    if (!user) {
      user = new User({
        githubId: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        avatarUrl: profile.photos?.[0]?.value
      });
      await user.save();
      logger.info(`New user created: ${user.username}`);
    } else {
      // Update user info
      user.username = profile.username;
      user.email = profile.emails?.[0]?.value || user.email;
      user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
      await user.save();
    }
    
    // Store access token for GitHub API calls
    user.accessToken = accessToken;
    return done(null, user);
  } catch (error) {
    logger.error('GitHub OAuth error:', error);
    return done(error, null);
  }
}));

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email', 'repo', 'read:org'] 
}));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: req.user._id, 
        githubId: req.user.githubId 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Redirect to client with token
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?token=${token}`);
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;