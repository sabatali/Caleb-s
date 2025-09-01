# Simple Node.js App

A basic Node.js application with Express server.

## Features

- Express.js server
- JSON API endpoints
- Health check endpoint
- Error handling
- Development mode with nodemon

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

## Available Endpoints

- `GET /` - Welcome message and server status
- `GET /health` - Health check endpoint
- `GET /api/hello` - Simple API response
- `POST /api/data` - Accept JSON data with name and message

## Example Usage

### Start the server
```bash
npm run dev
```

### Test endpoints
```bash
# Get welcome message
curl http://localhost:3000

# Health check
curl http://localhost:3000/health

# API hello
curl http://localhost:3000/api/hello

# POST data
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello World"}'
```

## Server Information

- **Port**: 3000 (configurable via PORT environment variable)
- **Framework**: Express.js
- **Node Version**: 14+ recommended
