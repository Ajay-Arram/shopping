from django.test import TestCase, Client
from django.contrib.auth.models import User
from products.models import Category, Product
import json


class ProductAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(
            name="Electronics",
            slug="electronics",
            description="Electronic items"
        )
        for i in range(10):
            Product.objects.create(
                external_product_id=f"PROD_{i}",
                name=f"Product {i}",
                brand="Test Brand",
                description="Test description",
                price=100.00 + i * 10,
                rating=4.0 + (i * 0.1),
                stock=10,
                category=self.category
            )

    def test_products_list(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 10)

    def test_products_limit(self):
        response = self.client.get('/api/products/?limit=8')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 8)

    def test_products_sort_rating_and_limit(self):
        response = self.client.get('/api/products/?sort=rating&limit=4')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 4)
        # Ratings should be descending
        ratings = [float(p['rating']) for p in data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_categories_list(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], "Electronics")

    def test_auth_user_anonymous(self):
        response = self.client.get('/api/auth/user/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json().get('is_authenticated'))

    def test_auth_login_invalid(self):
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'nonexistent', 'password': 'wrong'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_auth_register_and_login(self):
        # Register
        reg_resp = self.client.post(
            '/api/auth/register/',
            data=json.dumps({
                'username': 'newuser',
                'password': 'Password123!',
                'email': 'newuser@example.com'
            }),
            content_type='application/json'
        )
        self.assertEqual(reg_resp.status_code, 201)

        # Login
        login_resp = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'newuser', 'password': 'Password123!'}),
            content_type='application/json'
        )
        self.assertEqual(login_resp.status_code, 200)
