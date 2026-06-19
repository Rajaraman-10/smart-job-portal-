# Google OAuth Setup Guide

This guide explains how to set up Google OAuth login for the Smart Job Portal, replacing the previous mobile number OTP authentication.

## Changes Made

### Backend Changes
- ✅ Removed OTP model and SMS dependency (Twilio removed)
- ✅ Added Google OAuth verification using `google-auth` library
- ✅ New endpoint: `POST /api/auth/google-login/`
- ✅ Updated dependencies in `requirements.txt`
- ✅ Users are now created/authenticated using their Google email

### Frontend Changes
- ✅ Replaced 2-step OTP form with single-click Google login button
- ✅ Added `@react-oauth/google` package
- ✅ Updated `Login.js` to use Google Login component
- ✅ Added `loginWithGoogle()` function in `api.js`

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Go to "Credentials" and create an "OAuth 2.0 Client IDs" credential:
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `http://127.0.0.1:3000` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production URL
   - Copy the **Client ID** (you'll need this for frontend)

### 2. Backend Setup

1. Update Python dependencies:
   ```powershell
   cd backend
   pip install -r requirements.txt
   ```

2. Create/update `.env` file in the `backend` folder:
   ```
   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost 127.0.0.1
   GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   GOOGLE_OAUTH_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
   ```

3. Run migrations to remove the OTP table:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Start the backend server:
   ```powershell
   python manage.py runserver
   ```

### 3. Frontend Setup

1. Update npm dependencies:
   ```powershell
   cd frontend
   npm install
   ```

2. Create/update `.env` file in the `frontend` folder:
   ```
   REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
   REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   ```

3. Start the frontend development server:
   ```powershell
   npm start
   ```

## Testing the Login

1. Open `http://localhost:3000` in your browser
2. Select user type (Job Seeker or Recruiter)
3. Click the Google login button
4. Sign in with your Google account
5. You should be redirected to the portal

## API Endpoint

### Google Login
- **URL:** `POST /api/auth/google-login/`
- **Request:**
  ```json
  {
    "id_token": "google_id_token_from_frontend",
    "user_type": "jobseeker" | "recruiter"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "django_rest_framework_token",
    "user": {
      "id": 1,
      "username": "user@gmail.com",
      "email": "user@gmail.com",
      "first_name": "jobseeker",
      "last_name": "User"
    },
    "user_type": "jobseeker"
  }
  ```

## Troubleshooting

### "Google Client ID not configured" Error
- Make sure `REACT_APP_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Restart the React development server after updating `.env`

### "Invalid Google token" Error
- Ensure the Client ID in frontend matches the one in Google Cloud Console
- Verify that your domain is in the authorized JavaScript origins

### CORS Issues
- Check that frontend and backend have matching CORS configuration
- Verify `CORS_ALLOWED_ORIGINS` in `backend/settings.py`

## User Type Selection

The user still selects their role (Job Seeker or Recruiter) **before** clicking the Google login button. This is stored in the `first_name` field of the Django User model.

## Token Storage

After successful login, the frontend stores:
- `authToken` - Django REST Framework token
- `userType` - "jobseeker" or "recruiter"
- `user` - User object with id, username, email, etc.

These are stored in browser localStorage and can be retrieved for API authentication.

## Migration Notes

- The OTP table will be removed during migration
- Existing users will need to log in again with Google OAuth
- User emails from Google OAuth are used as unique identifiers
- If you want to preserve existing user data, you may need to manually match them by email

## Next Steps

1. Complete the Google Cloud setup
2. Update backend and frontend `.env` files with credentials
3. Install dependencies: `pip install -r requirements.txt` and `npm install`
4. Run migrations: `python manage.py migrate`
5. Start both backend and frontend servers
6. Test the login flow

For production deployment:
- Add your production domain to Google OAuth authorized origins
- Use environment variables for sensitive credentials
- Update `CORS_ALLOWED_ORIGINS` with your production domain
- Set `DEBUG = False` in production
