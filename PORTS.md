# 🚀 Fixed Port Configuration

## Overview
This system now uses **FIXED PORTS** to prevent the chaos of constantly changing ports.

## Port Configuration

### Server (Backend)
- **Port**: 5000 (FIXED)
- **URL**: http://localhost:5000
- **Environment Variable**: `PORT=5000`

### Client (Frontend)
- **Port**: 5173 (FIXED)
- **URL**: http://localhost:5173
- **Environment Variable**: `FRONTEND_URL=http://localhost:5173`

## How to Start

### Option 1: Use the Fixed Port Script (Recommended)
```bash
./start-fixed.sh
```

### Option 2: Manual Start
```bash
# Terminal 1: Start server
npm run dev:server

# Terminal 2: Start client
cd client && PORT=5173 npm run dev
```

### Option 3: Concurrent Start
```bash
npm run start:fixed
```

## What This Fixes

✅ **No more port conflicts** - Ports are fixed and won't change  
✅ **Consistent invitation links** - All links use port 5173  
✅ **Stable CORS configuration** - Only allows necessary ports  
✅ **Predictable URLs** - Always know where to access the system  

## Environment Variables

The following environment variables are automatically set:
- `PORT=5000` - Server port
- `FRONTEND_URL=http://localhost:5173` - Frontend URL for invitation links

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill all existing processes
pkill -f "vite"
pkill -f "tsx server/index.ts"
pkill -f "npm run dev"

# Then restart with the fixed script
./start-fixed.sh
```

### Check Port Status
```bash
# Check what's using the ports
lsof -i :5000
lsof -i :5173
```

## URLs

- **Main App**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Resume Upload**: http://localhost:5173/admin/resume-upload
- **API Endpoints**: http://localhost:5000/api/*
- **Health Check**: http://localhost:5000/health 