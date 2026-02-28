# Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and update the values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bkbs_db
JWT_ACCESS_SECRET=your_super_secret_access_token_key_min_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_min_32_characters_long
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

**⚠️ IMPORTANT:** Change the JWT secrets in production!

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run Migrations

Create the initial admin user:

```bash
npm run migrate up
```

This will create an admin user:

- **Email:** admin@example.com
- **Password:** Admin@123

**⚠️ IMPORTANT:** Change the admin password after first login!

### 5. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## Verify Installation

Visit `http://localhost:5000/api/health` to check if the server is running.

You should see:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

## Testing the API

### Using cURL

**Register a new user:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

**Access protected route:**

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up an environment variable for `baseUrl`: `http://localhost:5000`
3. After login, save the `accessToken` in an environment variable
4. Use `{{baseUrl}}` and `{{accessToken}}` in your requests

## Project Structure

```
bkbs_backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── env.js           # Environment variables
│   │
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   └── userController.js
│   │
│   ├── middlewares/         # Custom middleware
│   │   ├── auth.js          # Authentication & authorization
│   │   ├── errorHandler.js  # Global error handler
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── validate.js      # Request validation
│   │
│   ├── migrations/          # Database migrations
│   │   ├── 001_create_admin_user.js
│   │   └── runner.js        # Migration runner
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   └── RefreshToken.js
│   │
│   ├── repositories/        # Data access layer
│   │   ├── userRepository.js
│   │   └── refreshTokenRepository.js
│   │
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   │
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   └── userService.js
│   │
│   ├── utils/               # Utility functions
│   │   ├── apiResponse.js   # Response helpers
│   │   ├── helpers.js       # General helpers
│   │   └── jwt.js           # JWT utilities
│   │
│   ├── validations/         # Request validation schemas
│   │   ├── authValidation.js
│   │   └── userValidation.js
│   │
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
│
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── README.md               # Project documentation
└── API_DOCUMENTATION.md    # API documentation
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate up` - Run all migrations
- `npm run migrate down` - Rollback all migrations

## Default Users

After running migrations:

**Admin User:**

- Email: admin@example.com
- Password: Admin@123
- Role: admin

## Common Issues

### MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:** Make sure MongoDB is running:

```bash
# Check MongoDB status
brew services list | grep mongodb
# or
sudo systemctl status mongod
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:** Change the PORT in `.env` or kill the process using port 5000:

```bash
lsof -ti:5000 | xargs kill -9
```

### JWT Token Errors

**Error:** `Invalid or expired token`

**Solution:**

1. Make sure you're sending the token in the Authorization header
2. Check if the token has expired (access tokens expire in 15 minutes)
3. Use the refresh token endpoint to get a new access token

## Security Checklist

- [ ] Change default admin password
- [ ] Update JWT secrets in `.env`
- [ ] Set strong database password
- [ ] Enable HTTPS in production
- [ ] Configure CORS for your frontend domain
- [ ] Set appropriate rate limits
- [ ] Review and update security headers

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong, unique JWT secrets
3. Enable HTTPS
4. Use a production MongoDB instance
5. Set up proper logging
6. Configure rate limits based on your needs
7. Set up monitoring and error tracking

## Support

For issues or questions, please check:

- API_DOCUMENTATION.md for API usage
- README.md for project overview
- GitHub issues for known problems

## License

ISC
