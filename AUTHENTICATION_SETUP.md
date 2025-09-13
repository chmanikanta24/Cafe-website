# Authentication Setup Guide

## Backend Setup

The authentication system has been successfully added to your cafe website. Here's what was implemented:

### Features Added:
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes for orders
- User profile management

### Environment Variables Required:

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cafe
MONGODB_DB=cafe
MONGODB_MENU_COLLECTION=menuitems

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5174
```

### API Endpoints Added:

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user (protected)
- `POST /orders` - Create order (now requires authentication)
- `GET /orders` - Get user's orders (protected)

## Frontend Setup

### Features Added:
- Login and Signup modals
- Authentication context for state management
- Protected navigation
- User profile display
- Automatic token management

### Dependencies Added:
- `react-router-dom` for navigation

## How to Use:

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Create an account:**
   - Click "Login / Sign Up" in the header
   - Switch to "Sign Up" tab
   - Fill in your details and create an account

4. **Login:**
   - Use your email and password to login
   - You'll see "Welcome, [Your Name]" in the header when logged in

5. **Place Orders:**
   - Orders are now tied to your user account
   - You can view your order history (when implemented)

## Security Notes:

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- All sensitive routes require authentication
- Tokens are stored in localStorage (consider httpOnly cookies for production)

## Next Steps:

You may want to add:
- Password reset functionality
- Email verification
- User profile editing
- Order history page
- Admin panel for managing users/orders
