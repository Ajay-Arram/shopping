import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from products.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token


@ensure_csrf_cookie
def csrf_cookie(request):
    token = get_token(request)
    return JsonResponse({'detail': 'CSRF cookie set', 'csrfToken': token})

def get_or_create_cart(request):
    """
    Retrieves or creates a Cart for the current user or guest session.
    Accepts 'session-id' HTTP header or creates a new UUID session.
    """
    session_id = request.headers.get('session-id') or request.query_params.get('session_id')

    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        # If there's an anonymous cart matching session_id, merge items
        if session_id:
            anon_cart = Cart.objects.filter(session_key=session_id, user__isnull=True).first()
            if anon_cart and anon_cart.id != cart.id:
                for item in anon_cart.items.all():
                    existing_item = cart.items.filter(product=item.product).first()
                    if existing_item:
                        existing_item.quantity += item.quantity
                        existing_item.save()
                    else:
                        item.cart = cart
                        item.save()
                anon_cart.delete()
        return cart, session_id or ''

    # Anonymous user session handling
    if not session_id:
        if not request.session.session_key:
            request.session.save()
        session_id = request.session.session_key or str(uuid.uuid4())

    cart, _ = Cart.objects.get_or_create(session_key=session_id)
    return cart, session_id


class CartDetailView(APIView):
    """
    GET /api/cart/
    Returns current cart data.
    """
    def get(self, request):
        cart, session_id = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        response = Response(serializer.data)
        response['session-id'] = session_id
        return response


class CartAddView(APIView):
    """
    POST /api/cart/add/
    Payload: {"product_id": 1, "quantity": 1}
    """
    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                quantity = 1
        except (ValueError, TypeError):
            quantity = 1

        product = get_object_or_404(Product, id=product_id)

        if product.stock <= 0 or product.availability == 'Out of Stock':
            return Response({'error': 'Product is currently out of stock.'}, status=status.HTTP_400_BAD_REQUEST)

        cart, session_id = get_or_create_cart(request)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        # Cap at available stock
        if cart_item.quantity > product.stock:
            cart_item.quantity = product.stock

        cart_item.save()

        serializer = CartSerializer(cart)
        response = Response(serializer.data, status=status.HTTP_200_OK)
        response['session-id'] = session_id
        return response


class CartUpdateView(APIView):
    """
    POST /api/cart/update/
    Payload: {"product_id": 1, "quantity": 3} or {"item_id": 1, "quantity": 3}
    """
    def post(self, request):
        cart, session_id = get_or_create_cart(request)
        product_id = request.data.get('product_id')
        item_id = request.data.get('item_id')

        try:
            quantity = int(request.data.get('quantity', 1))
        except (ValueError, TypeError):
            return Response({'error': 'Invalid quantity.'}, status=status.HTTP_400_BAD_REQUEST)

        if item_id:
            cart_item = cart.items.filter(id=item_id).first()
        elif product_id:
            cart_item = cart.items.filter(product_id=product_id).first()
        else:
            return Response({'error': 'product_id or item_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart_item:
            return Response({'error': 'Item not found in cart.'}, status=status.HTTP_404_NOT_FOUND)

        if quantity <= 0:
            cart_item.delete()
        else:
            # Check stock
            if quantity > cart_item.product.stock:
                quantity = cart_item.product.stock
            cart_item.quantity = quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        response = Response(serializer.data, status=status.HTTP_200_OK)
        response['session-id'] = session_id
        return response


class CartRemoveView(APIView):
    """
    POST /api/cart/remove/
    Payload: {"product_id": 1} or {"item_id": 1}
    """
    def post(self, request):
        cart, session_id = get_or_create_cart(request)
        product_id = request.data.get('product_id')
        item_id = request.data.get('item_id')

        if item_id:
            cart.items.filter(id=item_id).delete()
        elif product_id:
            cart.items.filter(product_id=product_id).delete()
        else:
            return Response({'error': 'product_id or item_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CartSerializer(cart)
        response = Response(serializer.data, status=status.HTTP_200_OK)
        response['session-id'] = session_id
        return response


class CartClearView(APIView):
    """
    POST /api/cart/clear/
    Empties the cart.
    """
    def post(self, request):
        cart, session_id = get_or_create_cart(request)
        cart.items.all().delete()
        serializer = CartSerializer(cart)
        response = Response(serializer.data, status=status.HTTP_200_OK)
        response['session-id'] = session_id
        return response
