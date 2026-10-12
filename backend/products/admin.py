from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'product_count')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'external_product_id',
        'name',
        'brand',
        'category',
        'price',
        'original_price',
        'discount',
        'stock',
        'availability',
        'rating',
        'source',
    )
    list_filter = ('category', 'availability', 'source', 'brand')
    search_fields = ('name', 'brand', 'external_product_id', 'description')
    list_editable = ('price', 'stock', 'availability')
    readonly_fields = ('created_at', 'updated_at')
