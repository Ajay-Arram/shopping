"""
Root WSGI entry point for Render and Gunicorn deployment.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so apps like 'products' and 'cart' are discoverable
BASE_DIR = Path(__file__).resolve().parent / 'backend'
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
app = application  # Alias for platforms looking for 'app'
