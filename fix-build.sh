#!/bin/bash

# Fix script for Tailwind CSS native binding issue
# This script resolves the "Cannot find native binding" error

echo "🔧 Fixing Tailwind CSS native binding issue..."

# Step 1: Remove node_modules and package-lock.json
echo "📦 Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Step 2: Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Step 3: Install dependencies fresh
echo "📥 Installing dependencies..."
npm install

# Step 4: Verify build works
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Fix successful! Build completed."
    echo ""
    echo "Next steps:"
    echo "1. Commit the new package-lock.json:"
    echo "   git add package-lock.json"
    echo "   git commit -m 'Fix: Regenerate package-lock.json for cross-platform compatibility'"
    echo "   git push origin main"
    echo ""
    echo "2. The GitHub Actions workflow should now work correctly."
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi
