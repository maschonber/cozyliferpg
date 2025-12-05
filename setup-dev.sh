#!/bin/bash

echo "🚀 Setting up CozyLife RPG for local development..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "📦 Starting PostgreSQL database..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "📚 Installing server dependencies..."
cd server
npm install

echo "🗄️  Database will be initialized automatically when server starts"
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start the backend:  cd server && npm run dev"
echo "  2. Start the frontend: npm start (from root directory)"
echo ""
echo "The database is running at: postgresql://cozylife:development@localhost:5432/cozyliferpg"
echo "To stop the database: docker-compose down"
