#!/bin/bash

echo "🚀 Starting LinkedIn Simulation..."

# Start Docker infrastructure
echo "▶ Building and starting Docker containers..."
docker compose -f infrastructure/docker-compose.yml -f infrastructure/compose.BSK.yml up -d --build
sleep 20

# Start Frontend
echo "▶ Starting Frontend..."
cd client
npm install --silent
npm run dev &
cd ..

echo ""
echo "✅ All services started!"
echo "   Frontend:    http://localhost:5173"
echo "   Profile:     http://localhost:8001/docs"
echo "   Jobs:        http://localhost:8002/docs"
echo "   Application: http://localhost:8003/docs"
echo "   Messaging:   http://localhost:8004/docs"
echo "   Analytics:   http://localhost:8005/docs"
echo "   AI:          http://localhost:8006/docs"
echo ""
echo "Press Ctrl+C to stop frontend (Docker keeps running)"
wait
