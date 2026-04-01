#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " DevTrails Monorepo Init Script"
echo "=========================================================="

# 1. Initialize Frontend PWA (if not already hydrated)
echo "Bootstrapping Frontend PWA with Next.js 15, Tailwind, Zustand..."
cd frontend-pwa
# Safe to just run npm install since I placed the package.json manually
npm install
cd ..

# 2. Initialize Go Backend
echo "Bootstrapping Go Core API..."
cd backend-go
go mod tidy
cd ..

# 3. Initialize Python AI Engine
echo "Bootstrapping AI Engine Python..."
cd ai-engine-python
pip install setuptools wheel virtualenv
pip install -r requirements.txt
cd ..

# 4. Initialize Oracle Service
echo "Bootstrapping Oracle Service..."
cd oracle-service
pip install -r requirements.txt
cd ..

echo "Initialization complete! Run the stack via your preferred IDE or Docker Compose."
