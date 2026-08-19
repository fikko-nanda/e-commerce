from django.contrib import admin
from .models import Store

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('store_name', 'user', 'phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('store_name', 'user__email', 'phone')
    actions = ['approve_stores', 'reject_stores']

    @admin.action(description='Setuju/Approve toko yang dipilih')
    def approve_stores(self, request, queryset):
        queryset.update(status=Store.Status.ACTIVE)

    @admin.action(description='Tolak/Reject toko yang dipilih')
    def reject_stores(self, request, queryset):
        queryset.update(status=Store.Status.REJECTED)