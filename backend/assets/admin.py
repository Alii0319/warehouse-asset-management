from django.contrib import admin

from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('asset_id', 'category', 'source', 'created_at')
    search_fields = ('asset_id', 'category', 'external_reference')
    list_filter = ('source', 'category')
    readonly_fields = ('created_at',)
