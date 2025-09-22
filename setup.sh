#!/bin/bash

# Lacrosse League Management System - Setup Script
echo "🥍 Setting up Lacrosse League Management System..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -f "frontend/package.json" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Backend setup
echo "🔧 Setting up backend..."
cd backend
if [[ ! -f ".env" ]]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your MongoDB connection string"
fi

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

cd ..

# Frontend setup
echo "🔧 Setting up frontend..."
cd frontend
if [[ ! -f ".env" ]]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env with your backend URL"
fi

echo "📦 Installing Node.js dependencies..."
yarn install

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your MongoDB connection string"
echo "2. Edit frontend/.env with your backend URL" 
echo "3. Start the backend: cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
echo "4. Start the frontend: cd frontend && yarn start"
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "🔑 For Google Drive integration:"
echo "1. Create a Google Cloud Console project"
echo "2. Enable Google Drive API" 
echo "3. Create OAuth 2.0 credentials"
echo "4. Configure credentials in the admin panel"