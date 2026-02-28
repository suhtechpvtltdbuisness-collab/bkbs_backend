# BKBS Backend

Express.js backend with MongoDB, JWT authentication, and authorization.

## Features

- 🔐 JWT Authentication (Access & Refresh Tokens)
- 🛡️ Authorization with role-based access control
- 🚦 Rate limiting
- 🔒 Security best practices (Helmet, Sanitization)
- 📝 Request validation with Joi
- 🗄️ MongoDB with Mongoose
- 🏗️ Clean architecture (Repository, Service, Controller pattern)
- 🌍 Global error handler
- 🔄 Database migrations support

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bkbs_db
JWT_ACCESS_SECRET=your_access_token_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Run migrations
npm run migrate
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── migrations/     # Database migrations
├── models/         # Mongoose schemas
├── repositories/   # Data access layer
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Request validation schemas
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User Management

- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `GET /api/users` - Get all users (Admin only)

## License

ISC
