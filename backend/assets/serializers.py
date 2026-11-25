from django.utils import timezone
from rest_framework import serializers

from .models import Asset
from .validators import validate_asset_photograph


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for creating, listing, and retrieving warehouse assets."""

    photograph = serializers.ImageField(validators=[validate_asset_photograph])
    photograph_url = serializers.SerializerMethodField()
    created_date = serializers.SerializerMethodField()
    created_time = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id',
            'asset_id',
            'category',
            'photograph',
            'photograph_url',
            'created_at',
            'created_date',
            'created_time',
            'source',
            'external_reference',
            'metadata',
        ]
        read_only_fields = ['id', 'created_at', 'created_date', 'created_time', 'photograph_url']

    def get_photograph_url(self, obj: Asset) -> str | None:
        if not obj.photograph:
            return None
        request = self.context.get('request')
        url = obj.photograph.url
        return request.build_absolute_uri(url) if request else url

    def get_created_date(self, obj: Asset) -> str:
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime('%Y-%m-%d')

    def get_created_time(self, obj: Asset) -> str:
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime('%I:%M %p')

    def validate_asset_id(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Asset ID is required.')
        qs = Asset.objects.filter(asset_id__iexact=cleaned)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f'An asset with ID "{cleaned}" already exists.')
        return cleaned

    def validate_category(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Category is required.')
        return cleaned

    def validate_external_reference(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None
