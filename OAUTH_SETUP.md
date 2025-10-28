# OAuth Setup Guide

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Set Application type to "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Environment Variables
Create a `.env.local` file in your project root with:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth Configuration (optional)
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## GitHub OAuth Setup (Optional)

### 1. Create GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL to:
   - `http://localhost:3000/api/auth/callback/github` (for development)
   - `https://yourdomain.com/api/auth/callback/github` (for production)

### 2. Get Client ID and Secret
1. Copy the Client ID and Client Secret
2. Add them to your `.env.local` file

## Testing the Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/profile`
3. Click "Continue with Google" or "Continue with GitHub"
4. Complete the OAuth flow
5. You should be redirected back to the profile page with your user information

## Production Deployment

1. Update the redirect URIs in your OAuth providers to use your production domain
2. Set `NEXTAUTH_URL` to your production URL
3. Generate a secure `NEXTAUTH_SECRET` (you can use: `openssl rand -base64 32`)

## Troubleshooting

- Make sure all environment variables are set correctly
- Check that redirect URIs match exactly (including http vs https)
- Ensure your OAuth apps are configured for the correct environment
- Check browser console for any authentication errors
