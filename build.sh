#!/usr/bin/env bash
# Render Build Script for shopping application
# Exit immediately if a command exits with a non-zero status
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Apply database migrations to Supabase PostgreSQL
python backend/manage.py migrate --noinput

# 3. Collect static files for WhiteNoise
python backend/manage.py collectstatic --noinput
