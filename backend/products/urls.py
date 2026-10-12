from django.urls import path
from .views import ProductListView, ProductDetailView, CategoryListView, ProductSyncView

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/sync/', ProductSyncView.as_view(), name='product-sync'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
]
