# API Usage Examples

This document provides practical examples of how to use the Agile Coach Agent API.

## Authentication

### 1. GitHub OAuth Login
```bash
# Redirect user to GitHub OAuth
GET /api/auth/github

# After successful OAuth, you'll receive a JWT token
# Use this token in all subsequent API calls
Authorization: Bearer <your-jwt-token>
```

### 2. Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "_id": "user_id",
  "githubId": "12345",
  "username": "developer",
  "email": "developer@example.com",
  "skillLevel": "intermediate",
  "avatarUrl": "https://github.com/avatar.jpg"
}
```

## Project Management

### 1. Create New Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-commerce Platform",
    "description": "Modern e-commerce platform with React and Node.js",
    "githubRepo": {
      "name": "ecommerce-platform",
      "fullName": "company/ecommerce-platform",
      "url": "https://github.com/company/ecommerce-platform"
    }
  }'
```

### 2. Add Team Members
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "member_user_id",
    "role": "member",
    "skillLevel": "beginner"
  }'
```

### 3. Get AI Coaching Insights
```bash
curl -X GET http://localhost:3000/api/projects/PROJECT_ID/insights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "insights": [
    "Team has good skill balance with 1 expert mentoring 2 intermediate developers",
    "Current velocity is 85% of planned capacity"
  ],
  "recommendations": [
    "Consider pairing beginner developer with advanced developer for knowledge transfer",
    "Break down large issues into smaller, more manageable tasks"
  ],
  "risks": [
    "High priority items assigned to single developer - consider adding backup"
  ],
  "nextActions": [
    "Schedule retrospective meeting",
    "Update sprint burndown chart"
  ]
}
```

## Kanban Board Operations

### 1. Get Kanban Board
```bash
curl -X GET http://localhost:3000/api/kanban/PROJECT_ID/board \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "columns": [
    {
      "name": "Backlog",
      "status": "backlog",
      "issues": [
        {
          "_id": "issue_id",
          "title": "Implement user authentication",
          "description": "Add JWT-based authentication system",
          "priority": "high",
          "size": "l",
          "assignee": {
            "username": "john_dev",
            "skillLevel": "advanced"
          },
          "aiAnalysis": {
            "suggestedSize": "l",
            "estimatedDuration": 16,
            "complexity": "moderate"
          }
        }
      ]
    }
  ]
}
```

### 2. Create New Issue
```bash
curl -X POST http://localhost:3000/api/kanban/PROJECT_ID/issues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add Product Catalog API",
    "description": "Create REST API endpoints for product management:\n- GET /products (list with pagination)\n- GET /products/:id (single product)\n- POST /products (create new product)\n- PUT /products/:id (update product)\n- DELETE /products/:id (delete product)\n\nRequirements:\n- Input validation\n- Error handling\n- Unit tests",
    "assignee": "developer_user_id",
    "priority": "medium",
    "labels": ["backend", "api", "feature"]
  }'
```

### 3. Move Issue Between Columns
```bash
curl -X PUT http://localhost:3000/api/kanban/PROJECT_ID/issues/ISSUE_ID/move \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "position": 0
  }'
```

### 4. Auto-Analyze Issues with AI
```bash
curl -X POST http://localhost:3000/api/kanban/PROJECT_ID/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "message": "AI analysis completed",
  "results": [
    {
      "issueId": "issue_id_1",
      "status": "success"
    },
    {
      "issueId": "issue_id_2",
      "status": "success"
    }
  ],
  "processed": 2
}
```

## Chat with AI Coach

### 1. Start Chat Session
```bash
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID"
  }'
```

### 2. Send Message to AI Coach
```bash
curl -X POST http://localhost:3000/api/chat/sessions/SESSION_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Our sprint is behind schedule. What should we do?",
    "contextUpdate": {
      "focusArea": "execution"
    }
  }'
```

Response:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Our sprint is behind schedule. What should we do?",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "I can see you're facing sprint delays. Here are some strategies to get back on track:\n\n1. **Prioritize ruthlessly**: Focus only on must-have features for this sprint\n2. **Break down large issues**: Split XL and L issues into smaller, manageable tasks\n3. **Team collaboration**: Consider pair programming for complex tasks\n4. **Daily check-ins**: Increase standup frequency to identify blockers quickly\n\nBased on your team composition, I recommend having your expert developer mentor the beginner on critical path items. Would you like me to suggest specific task reassignments?",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ]
}
```

### 3. Chat Examples by Team Role

#### For Beginner Developer:
```json
{
  "message": "I'm stuck on implementing the login form validation. Can you help?"
}
```

AI Response:
```
I understand validation can be tricky when you're starting out! Here's a step-by-step approach:

1. **Start simple**: Begin with required field validation
2. **Use existing libraries**: Consider using libraries like Joi or Yup
3. **Client-side first**: Implement basic validation in the frontend
4. **Server-side security**: Always validate on the backend too

For your skill level, I recommend pairing with Sarah (your advanced team member) for the backend validation logic. Would you like me to create smaller subtasks to make this more manageable?
```

#### For Expert Developer:
```json
{
  "message": "Our API performance is degrading with increased load. Architecture advice?"
}
```

AI Response:
```
Great question! For performance optimization at scale, consider these architectural patterns:

1. **Caching Strategy**: Implement Redis for frequently accessed data
2. **Database Optimization**: Add indexes, consider read replicas
3. **API Design**: Implement pagination, field selection, and compression
4. **Microservices**: Consider breaking monolith into focused services
5. **Load Balancing**: Implement horizontal scaling

As the technical lead, you might want to:
- Conduct a performance audit with the team
- Assign optimization tasks based on team member strengths
- Set up monitoring and alerting

Would you like me to create a technical debt backlog for these improvements?
```

## Analytics & Reporting

### 1. Get Burndown Chart
```bash
curl -X GET http://localhost:3000/api/analytics/sprints/SPRINT_ID/burndown \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Team Velocity
```bash
curl -X GET http://localhost:3000/api/analytics/projects/PROJECT_ID/velocity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "velocityData": [
    {
      "sprint": "Sprint 1",
      "velocity": 42,
      "plannedPoints": 50,
      "completedPoints": 42,
      "completionRate": 84
    },
    {
      "sprint": "Sprint 2", 
      "velocity": 38,
      "plannedPoints": 45,
      "completedPoints": 38,
      "completionRate": 84.4
    }
  ],
  "averageVelocity": 40,
  "sprintCount": 2,
  "trend": "stable"
}
```

### 3. Team Performance Analytics
```bash
curl -X GET http://localhost:3000/api/analytics/projects/PROJECT_ID/team-performance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "teamPerformance": [
    {
      "user": {
        "username": "sarah_expert",
        "skillLevel": "expert"
      },
      "totalIssues": 8,
      "completedIssues": 7,
      "completedPoints": 35,
      "completionRate": 87.5,
      "averageIssueSize": 4.4
    },
    {
      "user": {
        "username": "mike_beginner",
        "skillLevel": "beginner"
      },
      "totalIssues": 6,
      "completedIssues": 5,
      "completedPoints": 12,
      "completionRate": 83.3,
      "averageIssueSize": 2.0
    }
  ],
  "skillDistribution": {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 1,
    "expert": 1
  }
}
```

## Real-time Features (WebSocket)

### 1. Connect to WebSocket
```javascript
const socket = io('http://localhost:3000');

// Authenticate user
socket.emit('authenticate', {
  userId: 'your_user_id',
  username: 'your_username',
  projectId: 'project_id'
});
```

### 2. Listen for Real-time Updates
```javascript
// Kanban board updates
socket.on('kanban:issueMoved', (data) => {
  console.log(`Issue ${data.issueId} moved from ${data.fromStatus} to ${data.toStatus}`);
  // Update UI accordingly
});

// New issue created
socket.on('issue:created', (data) => {
  console.log('New issue created:', data.issue.title);
  // Add issue to board
});

// User online/offline status
socket.on('userOnline', (data) => {
  console.log(`${data.username} is now online`);
});

// Chat typing indicators
socket.on('chat:userTyping', (data) => {
  if (data.isTyping) {
    console.log(`${data.username} is typing...`);
  }
});
```

### 3. Send Real-time Updates
```javascript
// Move issue
socket.emit('kanban:issueMove', {
  projectId: 'project_id',
  issueId: 'issue_id',
  fromStatus: 'ready',
  toStatus: 'in_progress',
  movedBy: 'username'
});

// Update typing status
socket.emit('chat:typing', {
  sessionId: 'chat_session_id',
  isTyping: true
});
```

## Skill Level Adaptation Examples

### Task Assignment by Skill Level

#### Beginner (8-12 points/sprint):
```json
{
  "title": "Create Login Form Component",
  "description": "Build a simple React login form with:\n- Email and password fields\n- Basic client-side validation\n- Submit button\n- Loading state\n\nAcceptance Criteria:\n- Form fields are properly labeled\n- Submit calls parent component handler\n- Shows loading spinner during submission",
  "size": "s",
  "estimatedDuration": 4,
  "complexity": "simple"
}
```

#### Intermediate (15-20 points/sprint):
```json
{
  "title": "Implement User Registration API",
  "description": "Create user registration endpoint:\n- POST /api/auth/register\n- Input validation (email format, password strength)\n- Hash password with bcrypt\n- Save to database\n- Return JWT token\n- Handle duplicate email errors",
  "size": "m", 
  "estimatedDuration": 8,
  "complexity": "moderate"
}
```

#### Advanced (20-25 points/sprint):
```json
{
  "title": "Design Authentication Middleware System",
  "description": "Create comprehensive auth system:\n- JWT token validation middleware\n- Role-based access control\n- Token refresh mechanism\n- Rate limiting for auth endpoints\n- Security headers configuration\n- Integration tests",
  "size": "l",
  "estimatedDuration": 16,
  "complexity": "complex"
}
```

#### Expert (25-30 points/sprint):
```json
{
  "title": "Architecture: Scalable Microservices Design",
  "description": "Design and implement microservices architecture:\n- Service discovery and communication\n- API gateway setup\n- Database per service pattern\n- Event-driven communication\n- Monitoring and logging\n- Deployment pipeline\n- Team mentoring and code review",
  "size": "xl",
  "estimatedDuration": 24,
  "complexity": "very_complex"
}
```

## Error Handling

### Common Error Responses

#### Authentication Error (401)
```json
{
  "error": "Invalid or expired token"
}
```

#### Access Denied (403)
```json
{
  "error": "Access denied"
}
```

#### Not Found (404)
```json
{
  "error": "Project not found"
}
```

#### Validation Error (400)
```json
{
  "error": "Invalid status",
  "details": "Status must be one of: backlog, ready, in_progress, review, testing, done"
}
```

This comprehensive API enables building a full-featured Agile Coach application that adapts to different skill levels and provides intelligent project management assistance.