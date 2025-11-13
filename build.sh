#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build completed successfully!"

