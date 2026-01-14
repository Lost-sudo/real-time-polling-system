# Real-Time Polling System

A robust, real-time polling application built with **Node.js**, **Express**, **Socket.IO**, and **PostgreSQL**. This system enables users to create polls, vote in real-time, and see live updates as votes are cast.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [License](#-license)

---

## ✨ Features

- **Real-time Updates**: Live vote counting using WebSocket connections (Socket.IO)
- **Poll Management**: Create, retrieve, and manage polls with multiple options
- **Vote Tracking**: Prevent duplicate voting using IP addresses or session cookies
- **RESTful API**: Clean REST endpoints for poll operations
- **Type Safety**: Full TypeScript implementation for enhanced developer experience
- **Database ORM**: Prisma for type-safe database operations
- **Comprehensive Testing**: Unit tests for controllers and services with Jest
- **CORS Support**: Configurable cross-origin resource sharing
- **Session Management**: Cookie-based session tracking for voters

---

## 🛠 Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^5.2.1 | Web framework for building REST APIs |
| **socket.io** | ^4.8.3 | Real-time bidirectional event-based communication |
| **@prisma/client** | ^7.2.0 | Type-safe database ORM |
| **@prisma/adapter-pg** | ^7.2.0 | PostgreSQL adapter for Prisma |
| **pg** | ^8.16.3 | PostgreSQL client for Node.js |
| **zod** | ^4.3.5 | TypeScript-first schema validation |
| **dotenv** | ^17.2.3 | Environment variable management |
| **cors** | ^2.8.5 | Cross-origin resource sharing middleware |
| **cookie-parser** | ^1.4.7 | Cookie parsing middleware |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **typescript** | ^5.9.3 | TypeScript compiler |
| **ts-node** | ^10.9.2 | TypeScript execution for Node.js |
| **nodemon** | ^3.1.11 | Auto-restart development server |
| **jest** | ^30.2.0 | Testing framework |
| **ts-jest** | ^29.4.6 | TypeScript preprocessor for Jest |
| **@types/jest** | ^30.0.0 | TypeScript definitions for Jest |
| **supertest** | ^7.2.2 | HTTP assertion library for testing |
| **jest-mock-extended** | ^4.0.0 | Enhanced mocking capabilities |
| **prisma** | ^6.19.2 | Prisma CLI for database migrations |
| **socket.io-client** | ^4.8.3 | Socket.IO client for testing |

---

## 🏗 Architecture

The application follows a **layered architecture** pattern:

```
┌─────────────────────────────────────┐
│         Client Layer                │
│   (HTTP Requests / WebSocket)       │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      Controllers Layer              │
│  (Request Handling & Validation)    │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│       Services Layer                │
│    (Business Logic)                 │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      Database Layer (Prisma)        │
│        (PostgreSQL)                 │
└─────────────────────────────────────┘
```

### Key Components

- **Controllers**: Handle HTTP requests and WebSocket events
- **Services**: Contain business logic and database operations
- **Routes**: Define API endpoints
- **Sockets**: Manage real-time WebSocket connections
- **Middleware**: Process requests (CORS, cookies, etc.)
- **Types**: TypeScript type definitions

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **PostgreSQL** (v12 or higher)
- **Git** (for cloning the repository)

---

## 🚀 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd real-time-polling-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Generate Prisma Client**

```bash
npm run prisma:generate
```

---

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# Client Configuration (for CORS)
CLIENT_URL=http://localhost:3000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port number | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `CLIENT_URL` | Allowed CORS origin | http://localhost:3000 |

---

## 🗄 Database Setup

### Database Schema

The application uses three main tables:

#### **Polls Table**
- `id` (UUID, Primary Key)
- `question` (String)
- `description` (String, Optional)
- `createdBy` (String, Optional)
- `isActive` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### **Options Table**
- `id` (UUID, Primary Key)
- `text` (String)
- `pollId` (UUID, Foreign Key)
- `voteCount` (Integer)
- `createdAt` (DateTime)

#### **Votes Table**
- `id` (UUID, Primary Key)
- `pollId` (UUID, Foreign Key)
- `optionId` (UUID, Foreign Key)
- `voterIdentifier` (String - IP or Session ID)
- `createdAt` (DateTime)

### Running Migrations

1. **Create and apply migrations**

```bash
npm run prisma:migrate
```

2. **Open Prisma Studio** (Database GUI)

```bash
npm run prisma:studio
```

---

## 🏃 Running the Application

### Development Mode

Start the development server with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Production Mode

1. **Build the application**

```bash
npm run build
```

2. **Start the production server**

```bash
npm start
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### **1. Create Poll**

```http
POST /api/polls
```

**Request Body:**
```json
{
  "question": "What is your favorite programming language?",
  "description": "Optional description",
  "options": ["JavaScript", "Python", "TypeScript", "Go"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question": "What is your favorite programming language?",
    "description": "Optional description",
    "createdBy": "127.0.0.1",
    "isActive": true,
    "createdAt": "2026-01-14T11:05:32.000Z",
    "updatedAt": "2026-01-14T11:05:32.000Z",
    "options": [
      {
        "id": "uuid",
        "text": "JavaScript",
        "voteCount": 0
      }
    ]
  }
}
```

#### **2. Get Poll by ID**

```http
GET /api/polls/:pollId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question": "What is your favorite programming language?",
    "description": "Optional description",
    "isActive": true,
    "createdAt": "2026-01-14T11:05:32.000Z",
    "updatedAt": "2026-01-14T11:05:32.000Z",
    "options": [...],
    "hasVoted": false
  }
}
```

#### **3. Get All Polls**

```http
GET /api/polls
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question": "Poll question",
      "options": [...]
    }
  ]
}
```

#### **4. Health Check**

```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T11:05:32.000Z"
}
```

---

## 🔌 WebSocket Events

### Client → Server Events

#### **1. Join Poll Room**

```javascript
socket.emit('joinPoll', { pollId: 'uuid' });
```

#### **2. Cast Vote**

```javascript
socket.emit('vote', {
  pollId: 'uuid',
  optionId: 'uuid'
});
```

### Server → Client Events

#### **1. Vote Update**

```javascript
socket.on('voteUpdate', (data) => {
  // data contains updated poll results
  console.log(data.options); // Updated vote counts
});
```

#### **2. Error**

```javascript
socket.on('error', (error) => {
  console.error(error.message);
});
```

---

## 🧪 Testing

The project includes comprehensive unit tests for all controllers and services.

### Running Tests

**Run all unit tests:**
```bash
npm run test:unit
```

**Run tests in watch mode:**
```bash
npm run test:unit:watch
```

### Test Coverage

The test suite includes:

#### **Poll Controller Tests** (`poll.controller.test.ts`)
- ✅ Create poll and return 201 status
- ✅ Return poll with hasVoted flag
- ✅ Return 404 when poll not found
- ✅ Use IP address when no session cookie
- ✅ Return all polls
- ✅ Handle errors gracefully

#### **Poll Service Tests** (`poll.service.test.ts`)
- ✅ Create a poll with multiple options
- ✅ Handle optional description field
- ✅ Propagate createdBy field when provided
- ✅ Return a poll when it exists
- ✅ Return null when poll does not exist
- ✅ Return all active polls
- ✅ Return empty array when no polls exist
- ✅ Successfully cast a new vote
- ✅ Prevent duplicate voting
- ✅ Update vote counts correctly
- ✅ Check if user has voted

#### **Socket Controller Tests** (`socket.controller.test.ts`)
- ✅ Handle vote events
- ✅ Validate vote data with Zod
- ✅ Emit vote updates to poll room
- ✅ Handle errors and emit error events
- ✅ Manage room connections

### Test Configuration

Tests are configured using **Jest** with **ts-jest** preset:

```javascript
// jest.config.js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src/tests/unit"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/server.ts",
        "!src/app.ts",
    ],
    clearMocks: true,
    resetMocks: true,
};
```

### All Tests Pass ✅

The entire test suite passes successfully, ensuring:
- **Type safety** with TypeScript
- **Proper error handling** across all layers
- **Correct business logic** implementation
- **Database operations** work as expected
- **Real-time features** function correctly

---

## 📁 Project Structure

```
real-time-polling-system/
├── prisma/
│   └── schema.prisma           # Database schema definition
├── src/
│   ├── config/
│   │   └── database.ts         # Database configuration
│   ├── controllers/
│   │   ├── poll.controller.ts  # Poll HTTP request handlers
│   │   └── socket.controller.ts # WebSocket event handlers
│   ├── generated/
│   │   └── prisma/             # Generated Prisma client
│   ├── middleware/             # Express middleware
│   ├── routes/
│   │   └── poll.routes.ts      # API route definitions
│   ├── services/
│   │   └── poll.service.ts     # Business logic layer
│   ├── sockets/
│   │   └── index.ts            # Socket.IO setup
│   ├── tests/
│   │   └── unit/
│   │       ├── controllers/    # Controller tests
│   │       ├── services/       # Service tests
│   │       └── mocks/          # Test mocks
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── app.ts                  # Express app configuration
│   └── server.ts               # Server entry point
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── jest.config.js              # Jest configuration
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start development server with auto-reload |
| **build** | `npm run build` | Compile TypeScript to JavaScript |
| **start** | `npm start` | Start production server |
| **test:unit** | `npm run test:unit` | Run unit tests |
| **test:unit:watch** | `npm run test:unit:watch` | Run tests in watch mode |
| **prisma:generate** | `npm run prisma:generate` | Generate Prisma client |
| **prisma:migrate** | `npm run prisma:migrate` | Run database migrations |
| **prisma:studio** | `npm run prisma:studio` | Open Prisma Studio GUI |

---

## 🔒 Security Features

- **IP-based Vote Tracking**: Prevents duplicate votes from the same IP
- **Session Cookies**: Alternative voter identification method
- **Input Validation**: Zod schema validation for all inputs
- **CORS Protection**: Configurable allowed origins
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Trust Proxy**: Accurate IP detection behind proxies

---

## 🚦 Error Handling

The application implements comprehensive error handling:

- **Validation Errors**: Zod schema validation with detailed error messages
- **Database Errors**: Graceful handling of database connection issues
- **Not Found Errors**: 404 responses for non-existent resources
- **Duplicate Vote Errors**: Prevents users from voting multiple times
- **WebSocket Errors**: Error events emitted to clients

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**JohnPatrick**

---

## 🙏 Acknowledgments

- **Prisma** for the excellent ORM
- **Socket.IO** for real-time capabilities
- **Express** for the robust web framework
- **Jest** for comprehensive testing tools
- **TypeScript** for type safety

---

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Built with ❤️ using Node.js, TypeScript, and PostgreSQL**
