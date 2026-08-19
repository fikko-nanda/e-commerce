from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'store', 'total_price', 'payment_method', 'payment_status', 'shipping_status')
    list_filter = ('payment_method', 'payment_status', 'shipping_status')