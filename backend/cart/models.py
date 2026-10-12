from django.db import models
from django.conf import settings
from products.models import Product


class Cart(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts'
    )
    session_key = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    @property
    def total_price(self):
        total = sum(item.subtotal for item in self.items.all())
        return round(float(total), 2)

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    def __str__(self):
        user_desc = self.user.username if self.user else f"Session:{self.session_key}"
        return f"Cart #{self.id} ({user_desc})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def subtotal(self):
        return round(float(self.product.price) * self.quantity, 2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
