# Admin Dashboard Setup Guide

## Overview

The admin dashboard is a Next.js application that provides a web interface for managing FunnyFy. It's hosted on Vercel at **zero additional cost**.

## Features

- ✅ **Dashboard Overview**: Real-time metrics and system status
- ✅ **Queue Monitoring**: View queue status, priority breakdown, and wait times  
- ✅ **Security Logs**: Monitor authentication attempts and security events
- ✅ **Cost Tracking**: View daily spending and cost statistics
- 🚧 **User Management**: Coming soon

## Tech Stack (Zero Cost)

- **Next.js**: React framework (free on Vercel)
- **Tailwind CSS**: Styling (free)
- **JWT Authentication**: Uses existing JWT system
- **Same API**: Uses existing Vercel serverless functions
- **Same Database**: Uses existing Postgres

## Setup Instructions

### 1. Create an Admin User

**Option A: Create via API (Easiest)**
```bash
# Create a new user and get the user ID
curl -X POST https://funnyfyapp.vercel.app/api/admin/create-admin-user \
  -H "Content-Type: application/json" \
  -d '{}'
```

This returns:
```json
{
  "ok": true,
  "userId": "abc-123-def-456",  ← Copy this!
  "message": "User created successfully",
  "instructions": [...]
}
```

**Option B: Use Existing User**
- Check your database: `SELECT id FROM users LIMIT 1;`
- Or use a user ID from your mobile app

### 2. Configure Admin Users in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `ADMIN_USER_IDS`
   - **Value**: `your-user-id-here` (or comma-separated: `id1,id2,id3`)
6. Select all environments (Production, Preview, Development)
7. Click **Save**
8. **Redeploy** your project (or wait for next deployment)

**Note**: Leave empty to allow any authenticated user (for testing only!)

### 3. Install Dependencies

```bash
cd admin
npm install
```

### 4. Configure Environment (Local Development)

Create `admin/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://funnyfyapp.vercel.app
```

For local development:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5. Run Locally

```bash
cd admin
npm run dev
```

Visit: `http://localhost:3001/admin/login`

### 6. Deploy to Vercel

**Option A: Same Project (Recommended)**
- Just push your code to GitHub
- Vercel automatically detects Next.js in `admin/` folder
- Deploys alongside your API
- **No extra setup needed!**

**Option B: Separate Project**
```bash
cd admin
vercel
```

This creates a separate Vercel project (still free).

## Accessing the Dashboard

1. Visit: `https://your-project.vercel.app/admin/login`
2. Login with an admin user ID (must be in `ADMIN_USER_IDS` env var)
3. Access the dashboard

## Pages

### `/admin/login`
- Admin login page
- Requires user ID that exists in database
- Generates JWT token with admin role

### `/admin` (Dashboard)
- Overview metrics
- Queue status
- Cost tracking
- Real-time updates (auto-refreshes every 30 seconds)

### `/admin/queue`
- Detailed queue monitoring
- Priority breakdown
- Queue metrics
- Auto-refreshes every 10 seconds

### `/admin/security`
- Security event logs
- Filter by success/failed
- Authentication attempts
- Webhook events

### `/admin/users`
- User management (coming soon)
- Subscription management
- Usage tracking

## Security

### Authentication
- JWT-based authentication
- Admin role required for all pages
- Tokens expire in 7 days

### Authorization
- Only users in `ADMIN_USER_IDS` can login
- All API endpoints check for admin role
- Secure token storage (localStorage for now)

### API Protection
- All `/api/admin/*` endpoints require admin authentication
- Uses `requireAdminAuth()` middleware
- Validates JWT token and admin role

## API Endpoints Used

The dashboard calls these existing API endpoints:

- `GET /api/admin/queue-stats` - Queue and spending statistics
- `GET /api/admin/security-logs` - Security event logs
- `POST /api/admin/login` - Admin login

## Cost

**$0 additional cost** - Everything is free:
- Next.js hosting: Vercel free tier
- API calls: Same as main app
- Database: Same Postgres instance
- Authentication: Existing JWT system

## Troubleshooting

### Can't login
- Verify user ID exists in database
- Check `ADMIN_USER_IDS` env var includes your user ID
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors

### API calls failing
- Verify CORS is configured in API endpoints
- Check API URL is correct
- Verify JWT_SECRET is set in Vercel
- Check browser network tab for error details

### Dashboard not loading
- Check you're logged in (localStorage should have `admin_token`)
- Verify API endpoints are accessible
- Check browser console for errors

### Build errors
- Make sure you've run `npm install` in the `admin/` directory
- Check Node.js version (Next.js 14 requires Node 18+)
- Verify all dependencies are installed

## Next Steps

1. **Add Admin Users Table**: Move admin user list to database
2. **Enhance User Management**: Build full user management interface
3. **Add More Analytics**: Charts for revenue, usage trends
4. **Real-time Updates**: WebSocket or Server-Sent Events
5. **Export Reports**: CSV/PDF export functionality

## Development

### Project Structure

```
admin/
├── pages/
│   ├── admin/
│   │   ├── index.tsx      # Dashboard
│   │   ├── login.tsx       # Login
│   │   ├── queue.tsx       # Queue monitoring
│   │   ├── security.tsx    # Security logs
│   │   └── users.tsx       # User management
│   └── _app.tsx            # App wrapper
├── components/
│   ├── Layout.tsx          # Main layout
│   └── StatCard.tsx        # Stat card
├── lib/
│   ├── auth.ts             # Auth utilities
│   └── api.ts              # API client
└── styles/
    └── globals.css         # Global styles
```

### Adding New Pages

1. Create page in `pages/admin/`
2. Use `Layout` component for consistent styling
3. Use `authenticatedFetch` from `lib/api.ts` for API calls
4. Add navigation link in `components/Layout.tsx`

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set
3. Check API endpoints are working
4. Review security logs for authentication issues

