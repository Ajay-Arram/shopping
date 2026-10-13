"""
Django settings for backend project (Shopping Cart).
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from root directory .env or backend .env
dotenv_path = BASE_DIR.parent / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv(BASE_DIR / '.env')

# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-shopping-cart-secret-key-2026')

IS_RENDER = os.getenv('RENDER') == 'true' or bool(os.getenv('RENDER_EXTERNAL_HOSTNAME'))

# In production on Render, default DEBUG to False; locally default to True
if IS_RENDER:
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes')
else:
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

allowed_hosts_env = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,shopping-omap.onrender.com,*.onrender.com')
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
render_hostname = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)
if 'shopping-omap.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('shopping-omap.onrender.com')
if '.onrender.com' not in ALLOWED_HOSTS and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # Local apps
    'products',
    'cart',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at the very top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serves static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR.parent / 'frontend',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database Configuration
# Supports Supabase PostgreSQL via DATABASE_URL or local MySQL / SQLite fallback
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    default_conn_max_age = int(os.getenv('DB_CONN_MAX_AGE', '600'))
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=default_conn_max_age,
            conn_health_checks=True,
        )
    }
    db_default = DATABASES['default']
    # Supabase PostgreSQL / PgBouncer connection optimizations
    if 'postgresql' in db_default.get('ENGINE', ''):
        # Disable server-side cursors for compatibility with PgBouncer
        db_default['DISABLE_SERVER_SIDE_CURSORS'] = True

        # Ensure OPTIONS dictionary exists and enforce sslmode='require'
        if not isinstance(db_default.get('OPTIONS'), dict):
            db_default['OPTIONS'] = {}
        db_default['OPTIONS'].setdefault('sslmode', 'require')

        # Port-specific pooling configurations
        port = str(db_default.get('PORT', '5432'))
        if port == '6543':
            # PgBouncer Transaction Pooler (port 6543):
            # Disable persistent connections and prepared statements
            db_default['CONN_MAX_AGE'] = 0
            db_default['OPTIONS']['prepare_threshold'] = None
        else:
            # Session Pooler (port 5432) or standard connection:
            # Prepared statements are supported, persistent connections can be used
            db_default['CONN_MAX_AGE'] = default_conn_max_age

        # Detect direct Supabase IPv6 host on Render and provide immediate clear guidance
        host = db_default.get('HOST', '')
        if IS_RENDER and host.startswith('db.') and host.endswith('.supabase.co'):
            from django.core.exceptions import ImproperlyConfigured
            raise ImproperlyConfigured(
                f"Direct Supabase host '{host}' resolves to IPv6 only, which Render cannot reach "
                f"(causes 'Network is unreachable'). Please update DATABASE_URL in Render to use the "
                f"Supabase Connection Pooler URI (Session mode: host 'aws-0-<region>.pooler.supabase.com', "
                f"port 5432, username 'postgres.<project-ref>')."
            )
elif IS_RENDER:
    # Guard against accidental localhost MySQL fallback when deployed to Render
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured(
        "DATABASE_URL environment variable is missing on Render. "
        "Please add DATABASE_URL (Supabase PostgreSQL connection string) in your Render Web Service Environment settings."
    )
elif os.getenv('DB_NAME'):
    # Local MySQL (existing development setup)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'shopping_cart'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'Mysql@123'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }
else:
    # Zero-config SQLite fallback for local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR.parent / 'frontend',
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
}

# CORS Configuration for frontend communication
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'session-id',
]

CORS_EXPOSE_HEADERS = [
    'session-id',
    'content-type',
    'x-csrftoken',
]

# CSRF Trusted Origins (Development & Production)
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://shopping-omap.onrender.com',
    'https://*.onrender.com',
]

render_external_url = os.getenv('RENDER_EXTERNAL_URL')
if render_external_url and render_external_url not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(render_external_url)

if render_hostname:
    render_origin = f'https://{render_hostname}'
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

csrf_origins_env = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if csrf_origins_env:
    for origin in csrf_origins_env.split(','):
        cleaned = origin.strip()
        if cleaned and cleaned not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(cleaned)

# Production Security & Cookie Configuration
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

if not DEBUG:
    # Render sits behind a reverse proxy that terminates SSL
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

