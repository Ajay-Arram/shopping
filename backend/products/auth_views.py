from django.contrib.auth import authenticate, login, logout, get_user_model
from django.middleware.csrf import get_token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from cart.models import Cart

User = get_user_model()


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that allows API calls without enforcing CSRF,
    preventing 403 Forbidden errors when submitting login/register requests from frontend.
    """
    def enforce_csrf(self, request):
        return


class LoginAPIView(APIView):
    """
    POST /api/auth/login/
    Payload: {"username": "...", "password": "..."}
    """
    authentication_classes = (CsrfExemptSessionAuthentication,)
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, user)
        csrf_token = get_token(request)

        # Merge anonymous cart if session-id exists
        session_id = request.headers.get('session-id') or request.query_params.get('session_id')
        if session_id:
            anon_cart = Cart.objects.filter(session_key=session_id, user__isnull=True).first()
            if anon_cart:
                user_cart, _ = Cart.objects.get_or_create(user=user)
                for item in anon_cart.items.all():
                    existing_item = user_cart.items.filter(product=item.product).first()
                    if existing_item:
                        existing_item.quantity += item.quantity
                        existing_item.save()
                    else:
                        item.cart = user_cart
                        item.save()
                anon_cart.delete()

        return Response({
            'message': 'Login successful',
            'csrfToken': csrf_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff
            }
        }, status=status.HTTP_200_OK)


class RegisterAPIView(APIView):
    """
    POST /api/auth/register/
    Payload: {"username": "...", "email": "...", "password": "..."}
    """
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        csrf_token = get_token(request)

        return Response({
            'message': 'Registration successful',
            'csrfToken': csrf_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff
            }
        }, status=status.HTTP_201_CREATED)


class LogoutAPIView(APIView):
    """
    POST /api/auth/logout/
    """
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    """
    GET /api/auth/user/
    """
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                    'is_staff': request.user.is_staff
                }
            })
        return Response({'authenticated': False, 'user': None})
