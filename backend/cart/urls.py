from django.urls import path
from . views import csrf_cookie
from .views import (
    CartDetailView,
    CartAddView,
    CartUpdateView,
    CartRemoveView,
    CartClearView
)

urlpatterns = [
    path('', CartDetailView.as_view(), name='cart-detail'),
    path('add/', CartAddView.as_view(), name='cart-add'),
    path('update/', CartUpdateView.as_view(), name='cart-update'),
    path('remove/', CartRemoveView.as_view(), name='cart-remove'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
    path('csrf/', csrf_cookie, name='cart-csrf-cookie'),
]
