#!/bin/bash

echo "🚀 Starting AI Interview Master with FIXED PORTS"
echo "================================================"
echo "📡 Server will run on: http://localhost:5000"
echo "🌐 Client will run on: http://localhost:5173"
echo "🔗 All invitation links will use: http://localhost:5173"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "vite" 2>/dev/null
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Check if ports are free
echo "🔍 Checking if ports are available..."
if lsof -i :5000 >/dev/null 2>&1; then
    echo "❌ Port 5000 is still in use. Please kill the process manually."
    exit 1
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "❌ Port 5173 is still in use. Please kill the process manually."
    exit 1
fi

echo "✅ Ports are free!"

# Start the server in the background
echo "🚀 Starting server on port 5000..."
npm run dev:server &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ! curl -s http://localhost:5000/health >/dev/null; then
    echo "❌ Server failed to start on port 5000"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Server is running on port 5000"

# Start the client
echo "🌐 Starting client on port 5173..."
cd client && PORT=5173 npm run dev &
CLIENT_PID=$!

# Wait a moment for client to start
sleep 5

# Check if client started successfully
if ! curl -s http://localhost:5173 >/dev/null; then
    echo "❌ Client failed to start on port 5173"
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 1
fi

echo "✅ Client is running on port 5173"
echo ""
echo "🎉 System is ready!"
echo "================================================"
echo "📡 Server: http://localhost:5000"
echo "🌐 Client: http://localhost:5173"
echo "👑 Admin: http://localhost:5173/admin"
echo "🔗 Resume Upload: http://localhost:5173/admin/resume-upload"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping services...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT

# Keep script running
wait 