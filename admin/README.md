# FunnyFy Admin Dashboard

A simple, zero-cost admin dashboard for managing FunnyFy, hosted on Vercel.

## Features

- **Dashboard Overview**: Real-time metrics and system status
- **Queue Monitoring**: View queue status, priority breakdown, and wait times
- **Security Logs**: Monitor authentication attempts and security events
- **Cost Tracking**: View daily spending and cost statistics
- **User Management**: (Coming soon) Manage users and subscriptions

## Tech Stack

- **Next.js**: React framework (free, hosted on Vercel)
- **Tailwind CSS**: Styling (free)
- **JWT Authentication**: Uses existing JWT system (no additional cost)
- **Same API**: Uses existing Vercel serverless functions

## Setup

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your API URL:

```bash
NEXT_PUBLIC_API_URL=https://funnyfyapp.vercel.app
```

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3001/admin/login`

### 4. Deploy to Vercel

The admin dashboard will be automatically deployed when you deploy your main project to Vercel. Vercel will detect the Next.js app in the `admin/` directory.

Or deploy separately:

```bash
cd admin
vercel
```

## Access

1. Visit your Vercel deployment: `https://your-project.vercel.app/admin/login`
2. Login with an existing user ID (for now, any user ID works - add admin role check later)
3. Access the dashboard

## Security

- **Authentication**: JWT-based (uses existing JWT system)
- **Admin Role Check**: (TODO) Add role-based access control
- **HTTPS**: Enforced by Vercel
- **CORS**: Configured for your domain

## Cost

**$0 additional cost** - Everything runs on Vercel's free tier:
- Next.js hosting: Free
- API calls: Same as main app
- Database: Same Postgres instance
- Authentication: Your existing JWT system

## Development

### Project Structure

```
admin/
├── pages/
│   ├── admin/
│   │   ├── index.tsx      # Dashboard
│   │   ├── login.tsx      # Login page
│   │   ├── queue.tsx      # Queue monitoring
│   │   ├── security.tsx   # Security logs
│   │   └── users.tsx      # User management
│   └── _app.tsx           # App wrapper
├── components/
│   ├── Layout.tsx         # Main layout
│   └── StatCard.tsx        # Stat card component
├── lib/
│   ├── auth.ts            # Authentication utilities
│   └── api.ts             # API client
└── styles/
    └── globals.css        # Global styles
```

## Next Steps

1. Add admin role checking (only allow specific user IDs)
2. Add user management interface
3. Add subscription management
4. Add more analytics and charts
5. Add real-time updates (WebSocket or polling)

## Troubleshooting

### Can't login
- Make sure the user ID exists in your database
- Check that `NEXT_PUBLIC_API_URL` is correct
- Verify JWT_SECRET is set in Vercel

### API calls failing
- Check CORS settings in your API endpoints
- Verify the API URL is correct
- Check browser console for errors

### Dashboard not loading
- Make sure you're logged in (check localStorage for `admin_token`)
- Verify API endpoints are working: `/api/admin/queue-stats`, `/api/admin/security-logs`

