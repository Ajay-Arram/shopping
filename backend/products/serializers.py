from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', default='', read_only=True)
    category_id = serializers.IntegerField(source='category.id', allow_null=True, read_only=True)
    category_slug = serializers.CharField(source='category.slug', default='', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'external_product_id',
            'name',
            'brand',
            'description',
            'price',
            'original_price',
            'discount',
            'image',
            'additional_images',
            'category',
            'category_id',
            'category_slug',
            'rating',
            'review_count',
            'stock',
            'availability',
            'product_url',
            'source',
            'features',
            'specifications',
            'created_at',
            'updated_at',
        ]
