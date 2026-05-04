#!/bin/bash
echo "🚀 Starting LinkedIn Simulation..."
echo "▶ Building and starting Docker containers..."
docker compose -f infrastructure/docker-compose.yml -f infrastructure/compose.BSK.yml up -d --build
echo "▶ Waiting for services to be ready..."
sleep 30

echo "▶ Waiting for MongoDB to be ready..."
until docker exec mongodb mongosh -u root -p rootpassword --authenticationDatabase admin --eval "db.adminCommand('ping')" &>/dev/null; do
  echo "   MongoDB not ready, waiting..."
  sleep 3
done
echo "   MongoDB ready."

echo "▶ Checking if seed data is needed..."
MEMBER_COUNT=$(docker exec mysql mysql -u appuser -papppassword linkedin_db -se "SELECT COUNT(*) FROM members;" 2>/dev/null)
if [ "$MEMBER_COUNT" = "0" ] || [ -z "$MEMBER_COUNT" ]; then
  echo "▶ Seeding database..."
  docker cp scripts/seed_data.py profile-api:/tmp/seed_data.py
  docker exec profile-api pip install faker pymongo tqdm -q
  docker exec profile-api sh -c "MONGO_URI='mongodb://root:rootpassword@mongodb:27017/linkedin_events' python3 /tmp/seed_data.py"
  docker cp scripts/seed_mongo.py profile-api:/tmp/seed_mongo.py
  docker exec profile-api sh -c "MONGO_URI='mongodb://root:rootpassword@mongodb:27017' python3 /tmp/seed_mongo.py"
  echo "✅ Seed complete!"
else
  echo "✅ Database already has data, skipping seed."
fi

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
