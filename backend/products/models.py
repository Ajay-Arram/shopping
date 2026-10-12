from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    image = models.URLField(max_length=1000, blank=True, default='')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    external_product_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=500)
    brand = models.CharField(max_length=200, blank=True, default='')
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    original_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount = models.IntegerField(default=0, help_text="Discount percentage e.g. 20 for 20%")
    image = models.URLField(max_length=1000, blank=True, default='')
    additional_images = models.JSONField(default=list, blank=True, help_text="List of extra image URLs")
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.00)
    review_count = models.IntegerField(default=0)
    stock = models.IntegerField(default=10)
    availability = models.CharField(max_length=100, default='In Stock')
    product_url = models.URLField(max_length=1000, blank=True, default='', help_text="Official Amazon or external product URL")
    source = models.CharField(max_length=100, default='Amazon')
    features = models.JSONField(default=list, blank=True, help_text="Bullet points: About this item")
    specifications = models.JSONField(default=dict, blank=True, help_text="Key-value specifications dictionary")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['brand']),
            models.Index(fields=['price']),
        ]

    def save(self, *args, **kwargs):
        # Calculate discount dynamically if original_price is given and discount is 0
        if self.original_price and self.original_price > self.price and not self.discount:
            diff = self.original_price - self.price
            self.discount = int(round((diff / self.original_price) * 100))
        # Update availability based on stock
        if self.stock <= 0:
            self.availability = 'Out of Stock'
        elif self.availability == 'Out of Stock' and self.stock > 0:
            self.availability = 'In Stock'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.brand})"
