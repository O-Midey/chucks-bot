#!/bin/bash

echo "🚀 Setting up Redis for testing..."

# Check if Redis is already running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is already running"
else
    echo "⏳ Starting Redis..."
    
    # Try to start Redis based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            if ! brew list redis &> /dev/null; then
                echo "📦 Installing Redis via Homebrew..."
                brew install redis
            fi
            echo "🔄 Starting Redis service..."
            brew services start redis
        else
            echo "❌ Homebrew not found. Please install Redis manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v systemctl &> /dev/null; then
            echo "🔄 Starting Redis service..."
            sudo systemctl start redis-server
        else
            echo "🔄 Starting Redis manually..."
            redis-server --daemonize yes
        fi
    else
        echo "❌ Unsupported OS. Please start Redis manually."
        exit 1
    fi
    
    # Wait a moment for Redis to start
    sleep 2
    
    # Check if Redis is now running
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis"
        exit 1
    fi
fi

echo "🧪 Installing test dependencies..."
npm install ioredis

echo "🎯 Running Redis tests..."
node tests/run-tests.js