# Agile Coach Agent

AI-powered Agile Coach Agent for managing Kanban projects with GitHub integration, designed to support teams of 4 developers with different skill levels (beginner, intermediate, advanced, expert).

## 🚀 Features

### Core Functionality
1. **LLM Communication** - Conversational interface with GitHub integration for project management
2. **Chat System** - Persistent chat history with contextual AI coaching
3. **GitHub OAuth** - Secure authentication and repository access
4. **Project Management** - Organization, repository, and project status monitoring
5. **Kanban Board** - Issue management with drag-and-drop interface
6. **AI Analysis** - Automatic issue sizing, prioritization, and duration estimation
7. **Analytics** - Burnup/burndown charts and velocity tracking
8. **Project Insights** - AI-powered recommendations and status reporting
9. **Real-time Collaboration** - WebSocket-based live updates
10. **Team Management** - Multi-skill level support with personalized coaching

### Target Team Structure
- **4 Developers**: Beginner, Intermediate, Advanced, Expert
- **4-Week Sprint Cycles**
- **Kanban Methodology**
- **GitHub Integration**

## 🏗️ Architecture

```
agile-coach-plan/
├── server/                 # Backend services
│   ├── app.js             # Main application server
│   ├── config/            # Configuration files
│   ├── models/            # Database models
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── middleware/        # Authentication & validation
├── client/                # Frontend application (TBD)
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **OpenAI API** for AI coaching features
- **GitHub API** for repository integration
- **JWT** for authentication
- **Winston** for logging

### Security & Performance
- **Helmet** for security headers
- **Rate limiting** for API protection
- **CORS** configuration
- **Input validation** and sanitization

## 🚦 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB
- GitHub OAuth App
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agile-coach-plan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   - GitHub OAuth credentials
   - OpenAI API key
   - MongoDB connection string
   - JWT secret

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   
   # Start individual services
   npm run chat-server
   npm run api-server
   ```

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: "Agile Coach Agent"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
3. Copy Client ID and Client Secret to your `.env` file

## 📡 API Endpoints

### Authentication
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `GET /api/projects/:id/insights` - Get AI coaching insights
- `POST /api/projects/:id/members` - Add team member

### Kanban Board
- `GET /api/kanban/:projectId/board` - Get Kanban board
- `PUT /api/kanban/:projectId/issues/:issueId/move` - Move issue
- `POST /api/kanban/:projectId/issues` - Create issue
- `PUT /api/kanban/:projectId/issues/:issueId` - Update issue
- `POST /api/kanban/:projectId/analyze` - AI analyze issues

### Chat System
- `POST /api/chat/sessions` - Start chat session
- `GET /api/chat/sessions` - Get user chat sessions
- `GET /api/chat/sessions/:sessionId` - Get chat session
- `POST /api/chat/sessions/:sessionId/messages` - Send message
- `PUT /api/chat/sessions/:sessionId/context` - Update chat context

### Analytics
- `GET /api/analytics/sprints/:sprintId/burndown` - Burndown chart
- `GET /api/analytics/projects/:projectId/burnup` - Burnup chart
- `GET /api/analytics/projects/:projectId/velocity` - Velocity metrics
- `GET /api/analytics/projects/:projectId/team-performance` - Team analytics
- `GET /api/analytics/projects/:projectId/issue-metrics` - Issue metrics

## 🧠 AI Coaching Features

### Issue Analysis
The AI automatically analyzes new issues and provides:
- **Size Estimation**: XS (1-2h), S (half day), M (1-2 days), L (3-5 days), XL (1+ week)
- **Priority Suggestion**: Low, Medium, High, Critical
- **Complexity Assessment**: Simple, Moderate, Complex, Very Complex
- **Risk Level**: Low, Medium, High
- **Duration Estimation**: Hours needed for completion
- **Tag Recommendations**: Technology and category tags

### Team Coaching
Based on team composition and performance:
- **Skill Balance Analysis**: Assessment of team capabilities
- **Workload Distribution**: Recommendations for task assignment
- **Performance Insights**: Individual and team metrics
- **Process Improvements**: Agile methodology suggestions
- **Risk Identification**: Potential blockers and issues

### Conversational Interface
- **Context-Aware Responses**: Understands current project and sprint context
- **Personalized Advice**: Tailored to team skill levels
- **Actionable Recommendations**: Specific steps to improve performance
- **Historical Analysis**: Learns from past sprints and decisions

## 📊 Analytics & Reporting

### Charts & Metrics
- **Burndown Charts**: Sprint progress tracking
- **Burnup Charts**: Cumulative project progress
- **Velocity Tracking**: Team performance over time
- **Issue Metrics**: Status distribution and completion rates
- **Team Performance**: Individual contributor analysis

### Real-time Updates
- **Live Kanban Board**: Real-time issue movements
- **Activity Feed**: Project activity notifications
- **Presence Indicators**: Team member online status
- **Collaborative Updates**: Instant change notifications

## 🔧 Development

### Project Structure
```
server/
├── models/               # Data models
│   ├── User.js          # User profile with skill levels
│   ├── Project.js       # Project configuration
│   ├── Issue.js         # Kanban issues with AI analysis
│   ├── Sprint.js        # Sprint management
│   └── ChatSession.js   # Chat conversation history
├── routes/              # API endpoints
├── services/            # Business logic
│   ├── aiService.js     # OpenAI integration
│   ├── githubService.js # GitHub API client
│   └── socketService.js # Real-time communication
└── middleware/          # Authentication & validation
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Code Quality
- ESLint configuration for consistent code style
- Automated testing with Jest
- Error logging with Winston
- Input validation and sanitization

## 🌐 Deployment

### Environment Variables
Required environment variables for production:
- `NODE_ENV=production`
- `MONGODB_URI` - Production database
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - OAuth credentials
- `OPENAI_API_KEY` - AI service access
- `JWT_SECRET` - Secure token signing

### Docker Support (Coming Soon)
Docker configuration for easy deployment and scaling.

## 📋 4-Week Implementation Plan

### Week 1: Foundation & Setup
- [x] Project structure and dependencies
- [x] Database models and schemas
- [x] Authentication with GitHub OAuth
- [x] Basic API endpoints
- [x] AI service integration

### Week 2: Core Features
- [ ] Kanban board implementation
- [ ] Issue management with AI analysis
- [ ] Real-time WebSocket communication
- [ ] Chat system with LLM integration
- [ ] GitHub repository synchronization

### Week 3: Analytics & Insights
- [ ] Burndown/burnup chart generation
- [ ] Velocity tracking and metrics
- [ ] Team performance analytics
- [ ] AI coaching recommendations
- [ ] Sprint management features

### Week 4: Polish & Advanced Features
- [ ] Frontend interface development
- [ ] Advanced AI coaching features
- [ ] Performance optimization
- [ ] Security enhancements
- [ ] Documentation and testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the API examples and test files

---

Built with ❤️ for the Microsoft Hackathon 2025
