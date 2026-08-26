from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'product_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__email', 'product__name', 'comment')
    readonly_fields = ('created_at',)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'Email User'

    def product_name(self, obj):
        return obj.product.name

    product_name.short_description = 'Produk'