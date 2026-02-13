# Scoda AI Backend

NestJS backend API for the Scoda AI Idea Generator application.

## Features

- 🔐 **Authentication**: JWT-based authentication with signup, login, and profile management
- 💡 **Idea Generation**: LangChain-powered AI idea generation with graph structure
- 📚 **Idea Management**: CRUD operations for saving, retrieving, updating, and deleting ideas
- 📊 **Analytics**: User insights and statistics
- 🗄️ **MongoDB**: Persistent data storage with Mongoose
- 📖 **Swagger Documentation**: Interactive API documentation at `/api`

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **LangChain** - AI workflow orchestration
- **OpenAI** - LLM integration for idea generation
- **TypeScript** - Type-safe development

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB instance (local or cloud)
- OpenAI API key (optional, falls back to mock data if not provided)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/scoda-ai
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key-here
CORS_ORIGIN=http://localhost:3000
```

3. Start MongoDB (if running locally):

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

4. Run the development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`

**Swagger Documentation**: Once the server is running, visit `http://localhost:3001/api` to view the interactive API documentation.

## API Documentation

Interactive Swagger documentation is available at `/api` when the server is running. You can:
- View all available endpoints
- Test API calls directly from the browser
- See request/response schemas
- Authenticate using the "Authorize" button

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Authentication

- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login with email and password
- `GET /auth/me` - Get current user profile (requires auth)
- `PUT /auth/profile` - Update user profile (requires auth)
- `POST /auth/logout` - Logout (requires auth)

### Ideas

- `POST /generate-ideas` - Generate ideas from a topic (requires auth)
- `POST /ideas` - Save an idea (requires auth)
- `GET /ideas` - Get all user's ideas (requires auth)
- `GET /ideas/:id` - Get a specific idea (requires auth)
- `PUT /ideas/:id` - Update an idea (requires auth)
- `DELETE /ideas/:id` - Delete an idea (requires auth)
- `POST /ideas/:id/refine` - Refine an existing idea (requires auth)

### Insights

- `GET /insights/stats` - Get user statistics (requires auth)
- `GET /insights/activity` - Get weekly activity (requires auth)
- `GET /insights/categories` - Get category distribution (requires auth)
- `GET /insights/most-active` - Get most active categories (requires auth)

## Request/Response Examples

### Signup

```bash
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "credits": 100
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Generate Ideas

```bash
POST /generate-ideas
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Mindful productivity"
}
```

Response:
```json
{
  "graph": {
    "nodes": [
      {
        "id": "node-1",
        "label": "Deep Work Sessions",
        "type": "main",
        "description": "Structured time blocks for focused work",
        "category": "Productivity"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "type": "hierarchical"
      }
    ],
    "metadata": {
      "topic": "Mindful productivity",
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "version": "1.0"
    }
  },
  "creditsUsed": 1
}
```

## Database Schemas

### User Schema

```typescript
{
  name: string;
  email: string;
  password: string (hashed);
  avatar?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Idea Schema

```typescript
{
  userId: ObjectId;
  topic: string;
  nodes: IdeaNode[];
  edges: IdeaEdge[];
  metadata?: {
    generatedAt: string;
    version?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)
- `OPENAI_API_KEY` - OpenAI API key for LangChain (optional)
- `GOOGLE_API_KEY` - Google API key (optional, for future use)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:3000)

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Run linting
npm run lint
```

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── dto/          # Data transfer objects
│   ├── schemas/       # MongoDB schemas
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── ideas/             # Ideas module
│   ├── dto/
│   ├── schemas/
│   ├── ideas.controller.ts
│   ├── ideas.service.ts
│   ├── langchain.service.ts
│   └── ideas.module.ts
├── insights/          # Analytics module
│   ├── insights.controller.ts
│   ├── insights.service.ts
│   └── insights.module.ts
├── app.module.ts      # Root module
├── app.controller.ts  # Health check
└── main.ts            # Application entry point
```

## Notes

- If `OPENAI_API_KEY` is not set, the service will use mock data for idea generation
- All protected routes require a valid JWT token in the `Authorization: Bearer <token>` header
- User passwords are hashed using bcrypt before storage
- Ideas are scoped to users - users can only access their own ideas

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Or check connection string
echo $MONGODB_URI
```

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run start:dev
```

### LangChain Not Working

- Ensure `OPENAI_API_KEY` is set in `.env`
- Check OpenAI API quota and billing
- The service will fall back to mock data if API calls fail
