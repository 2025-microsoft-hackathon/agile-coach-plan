// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/agile-coach-test';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock mongoose
const mockSchema = jest.fn().mockImplementation(() => ({
  index: jest.fn(),
  pre: jest.fn(),
  post: jest.fn(),
  methods: {},
  statics: {}
}));

// Add Schema.Types mock
mockSchema.Types = {
  ObjectId: jest.fn()
};

const mockModel = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue({})
}));

jest.mock('mongoose', () => ({
  Schema: mockSchema,
  model: jest.fn().mockImplementation(() => mockModel),
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    close: jest.fn().mockResolvedValue(true)
  },
  Types: {
    ObjectId: jest.fn()
  }
}));

// Mock database connection
jest.mock('../server/config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(true)
}));

// Mock OpenAI for tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                suggestedSize: 'm',
                suggestedPriority: 'medium',
                estimatedDuration: 8,
                complexity: 'moderate',
                riskLevel: 'low',
                tags: ['feature'],
                reasoning: 'Test analysis'
              })
            }
          }]
        })
      }
    }
  }));
});