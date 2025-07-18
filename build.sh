#!/bin/bash

echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build client
echo "🔨 Building client..."
cd client
npx vite build
cd ..

# Create dist directory
echo "📁 Creating dist directory..."
rm -rf dist/public
mkdir -p dist/public

# Copy client build
echo "📋 Copying client build..."
cp -r client/dist/* dist/public/

# Build server
echo "🔨 Building server..."
npx esbuild server/index.ts --bundle --platform=node --format=esm --packages=external --outdir=dist

echo "✅ Build completed successfully!" 