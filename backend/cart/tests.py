from django.test import TestCase, Client
from products.models import Category, Product
from cart.models import Cart, CartItem
import json


class CartAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(
            name="Electronics",
            slug="electronics"
        )
        self.product = Product.objects.create(
            external_product_id="TEST_PROD_1",
            name="Wireless Headphones",
            price=2999.00,
            stock=15,
            category=self.category
        )

    def test_get_cart_empty(self):
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('total_items'), 0)
        self.assertEqual(data.get('total_price'), 0.0)

    def test_cart_add_product(self):
        response = self.client.post(
            '/api/cart/add/',
            data=json.dumps({'product_id': self.product.id, 'quantity': 2}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('total_items'), 2)
        self.assertEqual(data.get('total_price'), 5998.0)
        self.assertEqual(len(data.get('items', [])), 1)

    def test_cart_update_quantity(self):
        # First add
        self.client.post(
            '/api/cart/add/',
            data=json.dumps({'product_id': self.product.id, 'quantity': 1}),
            content_type='application/json'
        )
        # Update
        response = self.client.post(
            '/api/cart/update/',
            data=json.dumps({'product_id': self.product.id, 'quantity': 5}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('total_items'), 5)
