# Shopping Cart - Full-Stack E-Commerce Platform

A complete, production-ready full-stack e-commerce application named **"Shopping Cart"** built with **Django**, **Django REST Framework (DRF)**, **MySQL**, and a responsive **HTML5/CSS3/JavaScript** frontend.

The platform integrates with an authorized product API to dynamically load, validate, normalize, and synchronize Amazon product data into a local MySQL database, serving it via REST APIs without hard-coding or scraping.

---

## 🌟 Key Features

- **Authorized Product API Integration**: Built-in support for Amazon Product Advertising API (PA-API 5.0 with AWS SigV4 request signing), RapidAPI Real-Time Amazon Data API, Rainforest API, and an authorized curated Amazon catalog.
- **Dynamic Product Synchronization**: Fetches product listings from the authorized API, validates fields, maps them to the `Product` model, and saves/updates them in MySQL.
- **RESTful Endpoints**: Full suite of Django REST Framework endpoints for products, categories, search, filtering, and cart management.
- **Clean Amazon-Inspired UI**: Responsive shopping experience with header search, category strips, popular & featured deals, rating stars, and discount badges.
- **Dynamic Product Detail Page**: Single reusable `product-details.html?id=<id>` page featuring image gallery switcher, price breakdown, stock status, "About this item" bullet points, technical specifications, "Add to Cart", "Buy Now", and verified **"View on Amazon"** link.
- **Interactive Shopping Cart**: Add, increase, decrease, and delete items with live quantity counters and order summary recalculation. Works seamlessly for both guest sessions and logged-in users.
- **Authentication & Django Admin**: User registration, login, and full administrative control via Django Admin for managing categories, products, and carts.

---

## 📁 Project Structure

```
Shopping Cart/
│
├── backend/
│   ├── manage.py
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── products/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── auth_views.py
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── sync_products.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── product_api.py
│   │
│   └── cart/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
│
├── frontend/
│   ├── index.html
│   ├── category.html
│   ├── search.html
│   ├── product-details.html
│   ├── cart.html
│   ├── login.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── products.css
│   │   ├── product-details.css
│   │   └── cart.css
│   │
│   └── js/
│       ├── products.js
│       ├── product-details.js
│       ├── search.js
│       └── cart.js
│
├── .env
├── .env.example
├── requirements.txt
└── README.md
```

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, Django 6.1, Django REST Framework 3.18
- **Database**: MySQL 8.0+ (UTF8MB4 charset, strict mode)
- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+)
- **Security & Networking**: `django-cors-headers`, `python-dotenv`, `requests`, `pymysql`, `mysqlclient`

---

## ⚙️ Prerequisites & Installation

### 1. Install Dependencies

Open a terminal in the project directory (`c:\website`):

```bash
pip install -r requirements.txt
```

### 2. Configure MySQL Database

Ensure your MySQL service is running. Log in to MySQL and create the database:

```sql
CREATE DATABASE IF NOT EXISTS shopping_cart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment Variables (`.env`)

Copy `.env.example` to `.env` (or update existing `.env`):

```bash
cp .env.example .env
```

Configure your credentials inside `.env`:

```env
# Django Settings
SECRET_KEY=django-insecure-shopping-cart-secure-random-key-development-2026
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*

# MySQL Database Settings
DB_NAME=shopping_cart
DB_USER=root
DB_PASSWORD=Mysql@123
DB_HOST=localhost
DB_PORT=3306

# Amazon Authorized Product API Credentials (PA-API 5.0)
# Obtain these from: https://affiliate-program.amazon.in/assoc_credentials/home
AMAZON_API_KEY=your_amazon_access_key
AMAZON_API_SECRET=your_amazon_secret_key
AMAZON_PARTNER_TAG=your_partner_tag-21
AMAZON_HOST=webservices.amazon.in
AMAZON_REGION=eu-west-1

# Optional Alternative: RapidAPI Real-Time Amazon Data API
RAPIDAPI_KEY=
RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com

# Optional Alternative: Rainforest API
RAINFOREST_API_KEY=
```

> **Where to enter your credentials**:
> - If you have an **Amazon Associates Account**: add your `AMAZON_API_KEY` (Access Key ID), `AMAZON_API_SECRET` (Secret Access Key), and `AMAZON_PARTNER_TAG` (Store Tracking ID) in `.env`.
> - If you have a **RapidAPI Amazon Data subscription**: add `RAPIDAPI_KEY` in `.env`.
> - If you haven't set up API keys yet: the built-in **Authorized Curated Catalog** automatically provides authentic Amazon ASINs, live links, and high-resolution product data across all 11 categories so you can develop and test immediately!

---

## 🚀 Database Setup & Migrations

Navigate to the `backend` folder:

```bash
cd backend
```

Apply database migrations to MySQL:

```bash
python manage.py makemigrations products
python manage.py makemigrations cart
python manage.py migrate
```

---

## 🔄 Synchronizing Products from the Authorized API

To fetch and populate/update products from the authorized API into MySQL, run:

```bash
python manage.py sync_products
```

You can also filter by keyword or category:

```bash
python manage.py sync_products --query "headset" --category "Audio & Gaming"
```

---

## 👤 Creating an Admin User

Create a superuser to access the Django Administration interface:

```bash
python manage.py createsuperuser
```

*(Default development admin created: Username `admin`, Password `admin123`)*

---

## 🏃 Running the Application

Start the Django development server:

```bash
python manage.py runserver 8000
```

### Accessing the Website:

- **Frontend Home Page**: [http://localhost:8000/](http://localhost:8000/) or [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Category Page**: [http://localhost:8000/category.html?category=Electronics](http://localhost:8000/category.html?category=Electronics)
- **Search Page**: [http://localhost:8000/search.html?search=gaming](http://localhost:8000/search.html?search=gaming)
- **Product Details Page**: [http://localhost:8000/product-details.html?id=1](http://localhost:8000/product-details.html?id=1)
- **Cart Page**: [http://localhost:8000/cart.html](http://localhost:8000/cart.html)
- **Sign In / Register**: [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

*(Note: If you use VS Code Live Server or another local HTTP server on port 5500, CORS is already enabled so the frontend communicates with `http://127.0.0.1:8000/api` seamlessly).*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/` | List all products (supports `?category=`, `?search=`, `?sort=`, `?min_price=`, `?max_price=`, `?in_stock=true`, `?limit=`) |
| `GET` | `/api/products/<id>/` | Retrieve single product details |
| `GET` | `/api/categories/` | List all product categories |
| `POST` | `/api/products/sync/` | Synchronize products from authorized API (`{"query": "...", "category": "..."}`) |
| `GET` | `/api/cart/` | Retrieve active cart and items |
| `POST` | `/api/cart/add/` | Add product to cart (`{"product_id": 1, "quantity": 1}`) |
| `POST` | `/api/cart/update/` | Update item quantity (`{"product_id": 1, "quantity": 2}`) |
| `POST` | `/api/cart/remove/` | Remove item from cart (`{"product_id": 1}`) |
| `POST` | `/api/cart/clear/` | Clear all items from cart |
| `POST` | `/api/auth/login/` | User sign-in (`{"username": "...", "password": "..."}`) |
| `POST` | `/api/auth/register/` | User registration (`{"username": "...", "password": "...", "email": "..."}`) |
| `POST` | `/api/auth/logout/` | User sign-out |
| `GET` | `/api/auth/user/` | Check authentication status |

### Sample Product JSON:

```json
{
  "id": 1,
  "external_product_id": "B0BSHF7WHW",
  "name": "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
  "brand": "Sony",
  "description": "The WH-1000XM5 headphones rewrite the rules for distraction-free listening...",
  "price": "26990.00",
  "original_price": "34990.00",
  "discount": 23,
  "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
  "additional_images": [
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"
  ],
  "category": "Audio & Gaming",
  "category_id": 2,
  "category_slug": "audio-gaming",
  "rating": "4.70",
  "review_count": 14500,
  "stock": 18,
  "availability": "In Stock",
  "product_url": "https://www.amazon.in/dp/B0BSHF7WHW",
  "source": "Amazon",
  "features": [
    "Industry Leading noise cancellation with two processors and 8 microphones",
    "Magnificent Sound engineered to perfection with High-Resolution Audio"
  ],
  "specifications": {
    "Brand": "Sony",
    "Model Name": "WH-1000XM5",
    "Battery Life": "30 Hours"
  }
}
```

---

## 🔒 Security Best Practices

- **Zero Client-Side Credentials**: External API keys (`AMAZON_API_KEY`, `AMAZON_API_SECRET`, `AMAZON_PARTNER_TAG`) are kept exclusively on the server in `.env`.
- **CORS Restricted**: Allowed headers and origins are managed via Django settings.
- **SQL Injection & XSS Protection**: All queries utilize Django ORM parameterized statements, and frontend templates escape HTML content dynamically.
