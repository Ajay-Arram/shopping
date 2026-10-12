from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from products.auth_views import LoginAPIView, RegisterAPIView, LogoutAPIView, CurrentUserAPIView
from cart.views import csrf_cookie

urlpatterns = [
    path('admin/', admin.site.urls),

    # CSRF Token API
    path('api/csrf/', csrf_cookie, name='csrf-cookie'),

    # Product and Category APIs
    path('api/', include('products.urls')),

    # Cart APIs
    path('api/cart/', include('cart.urls')),

    # Authentication APIs
    path('api/auth/login/', LoginAPIView.as_view(), name='auth-login'),
    path('api/auth/register/', RegisterAPIView.as_view(), name='auth-register'),
    path('api/auth/logout/', LogoutAPIView.as_view(), name='auth-logout'),
    path('api/auth/user/', CurrentUserAPIView.as_view(), name='auth-user'),

    # Direct Django Template / HTML Views (Frontend access via Django)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html'), name='home-file'),
    path('category.html', TemplateView.as_view(template_name='category.html'), name='category-page'),
    path('search.html', TemplateView.as_view(template_name='search.html'), name='search-page'),
    path('product-details.html', TemplateView.as_view(template_name='product-details.html'), name='product-details-page'),
    path('cart.html', TemplateView.as_view(template_name='cart.html'), name='cart-page'),
    path('login.html', TemplateView.as_view(template_name='login.html'), name='login-page'),

    # Direct CSS and JS static file routing for HTML relative paths
    re_path(r'^(?P<path>(css|js)/.*)$', serve, {'document_root': settings.BASE_DIR.parent / 'frontend'}),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
