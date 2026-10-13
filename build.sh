#!/usr/bin/env bash
# Render Build Script for shopping application
# Exit immediately if a command exits with a non-zero status
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Apply database migrations to Supabase PostgreSQL
python backend/manage.py migrate --noinput

# 3. Seed initial categories and products if database is fresh
python backend/manage.py shell -c "from products.models import Category; import sys; sys.exit(0 if Category.objects.exists() else 1)" 2>/dev/null && echo "Database already contains data, skipping seed." || python backend/manage.py loaddata backend/initial_data.json

# 4. Collect static files for WhiteNoise
python backend/manage.py collectstatic --noinput
