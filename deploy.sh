#!/bin/bash

echo "🚀 Starting Vercel deployment with proper logging..."

# Set production environment variables for logging
export NODE_ENV=production
export LOG_LEVEL=info

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📊 To view logs in production:"
echo "1. Go to https://vercel.com/omideys-projects/chuks-whatsapp"
echo "2. Click on Functions tab"
echo "3. View real-time logs for /api/webhook"
echo ""
echo "🔍 Log levels available:"
echo "- info: General application flow"
echo "- warn: Warning conditions"
echo "- error: Error conditions"
echo "- debug: Detailed debugging info"