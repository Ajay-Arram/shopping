from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from .services.product_api import ProductAPIService


class CategoryListView(ListAPIView):
    """
    GET /api/categories/
    Returns list of all product categories.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer


class ProductListView(ListAPIView):
    """
    GET /api/products/
    Query parameters:
    - category: Category name or slug (e.g. ?category=Electronics or ?category=audio-gaming)
    - search: Search keyword (e.g. ?search=gaming%20headset)
    - sort: price_asc, price_desc, rating_desc, newest
    - min_price / max_price: Filter by price range
    - in_stock: true
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related('category').all()

        # Filter by Category
        category_param = self.request.query_params.get('category')
        if category_param:
            queryset = queryset.filter(
                Q(category__name__iexact=category_param) |
                Q(category__slug__iexact=category_param)
            )

        # Filter by Search Keyword
        search_query = self.request.query_params.get('search')
        if search_query:
            terms = search_query.strip().split()
            for term in terms:
                queryset = queryset.filter(
                    Q(name__icontains=term) |
                    Q(brand__icontains=term) |
                    Q(description__icontains=term) |
                    Q(category__name__icontains=term)
                )

        # In-stock filter
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() in ('true', '1', 'yes'):
            queryset = queryset.filter(stock__gt=0)

        # Price range filter
        min_price = self.request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass

        # Sorting
        sort = self.request.query_params.get('sort', '-created_at')
        sort_map = {
            'price_asc': 'price',
            'price_desc': '-price',
            'rating_desc': '-rating',
            'rating': '-rating',
            'newest': '-created_at',
            'discount': '-discount',
        }
        order_field = sort_map.get(sort, '-created_at')
        queryset = queryset.order_by(order_field)

        # Limit if specified (for popular / featured sections)
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                return queryset[:int(limit)]
            except ValueError:
                pass

        return queryset


class ProductDetailView(RetrieveAPIView):
    """
    GET /api/products/<id>/
    Returns single product details.
    """
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    lookup_field = 'id'


class ProductSyncView(APIView):
    """
    POST /api/products/sync/
    Synchronizes product data from the authorized product API into MySQL.
    Can accept JSON body: {"query": "laptop", "category": "Laptops"}
    """
    def post(self, request, *args, **kwargs):
        query = request.data.get('query')
        category = request.data.get('category')

        service = ProductAPIService()
        result = service.sync_products(query=query, category_name=category)
        return Response(result, status=status.HTTP_200_OK)
