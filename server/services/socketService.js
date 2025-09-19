const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const connectedUsers = new Map();

const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (data) => {
      const { userId, username, projectId } = data;
      
      connectedUsers.set(socket.id, {
        userId,
        username,
        projectId,
        joinedAt: new Date()
      });

      socket.join(`user:${userId}`);
      if (projectId) {
        socket.join(`project:${projectId}`);
      }

      logger.info(`User authenticated: ${username} (${userId})`);
      
      // Notify project members that user is online
      if (projectId) {
        socket.to(`project:${projectId}`).emit('userOnline', {
          userId,
          username
        });
      }
    });

    // Handle joining project rooms
    socket.on('joinProject', (projectId) => {
      socket.join(`project:${projectId}`);
      
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.projectId = projectId;
        connectedUsers.set(socket.id, user);
      }
      
      logger.info(`User ${socket.id} joined project: ${projectId}`);
    });

    // Handle leaving project rooms
    socket.on('leaveProject', (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.info(`User ${socket.id} left project: ${projectId}`);
    });

    // Handle Kanban board updates
    socket.on('kanban:issueMove', (data) => {
      const { projectId, issueId, fromStatus, toStatus, movedBy } = data;
      
      // Broadcast to all project members
      socket.to(`project:${projectId}`).emit('kanban:issueMoved', {
        issueId,
        fromStatus,
        toStatus,
        movedBy,
        timestamp: new Date()
      });
      
      logger.info(`Issue ${issueId} moved from ${fromStatus} to ${toStatus} in project ${projectId}`);
    });

    // Handle issue updates
    socket.on('issue:update', (data) => {
      const { projectId, issueId, updates, updatedBy } = data;
      
      socket.to(`project:${projectId}`).emit('issue:updated', {
        issueId,
        updates,
        updatedBy,
        timestamp: new Date()
      });
      
      logger.info(`Issue ${issueId} updated in project ${projectId}`);
    });

    // Handle new issue creation
    socket.on('issue:create', (data) => {
      const { projectId, issue, createdBy } = data;
      
      socket.to(`project:${projectId}`).emit('issue:created', {
        issue,
        createdBy,
        timestamp: new Date()
      });
      
      logger.info(`New issue created in project ${projectId}: ${issue.title}`);
    });

    // Handle sprint updates
    socket.on('sprint:update', (data) => {
      const { projectId, sprintId, updates, updatedBy } = data;
      
      socket.to(`project:${projectId}`).emit('sprint:updated', {
        sprintId,
        updates,
        updatedBy,
        timestamp: new Date()
      });
      
      logger.info(`Sprint ${sprintId} updated in project ${projectId}`);
    });

    // Handle chat typing indicators
    socket.on('chat:typing', (data) => {
      const { sessionId, isTyping } = data;
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        socket.broadcast.emit('chat:userTyping', {
          sessionId,
          userId: user.userId,
          username: user.username,
          isTyping
        });
      }
    });

    // Handle real-time notifications
    socket.on('notification:send', (data) => {
      const { recipientId, notification } = data;
      
      // Send notification to specific user
      socket.to(`user:${recipientId}`).emit('notification:received', {
        ...notification,
        id: uuidv4(),
        timestamp: new Date()
      });
      
      logger.info(`Notification sent to user ${recipientId}`);
    });

    // Handle project activity feed
    socket.on('activity:add', (data) => {
      const { projectId, activity } = data;
      
      socket.to(`project:${projectId}`).emit('activity:new', {
        ...activity,
        id: uuidv4(),
        timestamp: new Date()
      });
    });

    // Handle burndown chart updates
    socket.on('burndown:update', (data) => {
      const { projectId, sprintId, burndownData } = data;
      
      socket.to(`project:${projectId}`).emit('burndown:updated', {
        sprintId,
        burndownData,
        timestamp: new Date()
      });
    });

    // Handle user presence updates
    socket.on('presence:update', (data) => {
      const { status, activity } = data;
      const user = connectedUsers.get(socket.id);
      
      if (user && user.projectId) {
        socket.to(`project:${user.projectId}`).emit('presence:userUpdate', {
          userId: user.userId,
          username: user.username,
          status,
          activity,
          timestamp: new Date()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        logger.info(`User disconnected: ${user.username} (${user.userId})`);
        
        // Notify project members that user went offline
        if (user.projectId) {
          socket.to(`project:${user.projectId}`).emit('userOffline', {
            userId: user.userId,
            username: user.username,
            disconnectedAt: new Date()
          });
        }
        
        connectedUsers.delete(socket.id);
      } else {
        logger.info(`Unknown user disconnected: ${socket.id}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [socketId, user] of connectedUsers.entries()) {
      if (now - user.joinedAt > staleThreshold) {
        connectedUsers.delete(socketId);
        logger.info(`Cleaned up stale connection: ${socketId}`);
      }
    }
  }, 60 * 60 * 1000); // Run cleanup every hour

  return io;
};

// Helper function to get connected users for a project
const getProjectUsers = (projectId) => {
  const projectUsers = [];
  for (const [socketId, user] of connectedUsers.entries()) {
    if (user.projectId === projectId) {
      projectUsers.push({
        socketId,
        userId: user.userId,
        username: user.username,
        joinedAt: user.joinedAt
      });
    }
  }
  return projectUsers;
};

// Helper function to broadcast to all users in a project
const broadcastToProject = (io, projectId, event, data) => {
  io.to(`project:${projectId}`).emit(event, data);
};

// Helper function to send notification to specific user
const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:received', {
    ...notification,
    id: uuidv4(),
    timestamp: new Date()
  });
};

module.exports = {
  initializeSocketHandlers,
  getProjectUsers,
  broadcastToProject,
  sendNotificationToUser
};