from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    subtotal = serializers.FloatField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product_id',
            'product',
            'quantity',
            'subtotal',
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.FloatField(read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id',
            'session_key',
            'total_items',
            'total_price',
            'items',
            'created_at',
            'updated_at',
        ]
