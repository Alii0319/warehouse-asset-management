from datetime import timedelta

from django.utils import timezone
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Asset
from .serializers import AssetSerializer


class AssetListCreateView(generics.ListCreateAPIView):
    """List warehouse assets (with optional ?search= on asset_id) or register a new asset."""

    serializer_class = AssetSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Asset.objects.all()
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(asset_id__icontains=search)
        return queryset


class AssetDetailView(generics.RetrieveAPIView):
    """Retrieve a single warehouse asset by primary key."""

    queryset = Asset.objects.all()
    serializer_class = AssetSerializer


class DashboardSummaryView(APIView):
    """Return real-time warehouse asset statistics for the dashboard."""

    def get(self, request):
        now_local = timezone.localtime(timezone.now())
        start_of_day = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        total_assets = Asset.objects.count()
        today_entries = Asset.objects.filter(
            created_at__gte=start_of_day,
            created_at__lt=end_of_day,
        ).count()
        categories = list(
            Asset.objects.order_by('category')
            .values_list('category', flat=True)
            .distinct()
        )

        return Response(
            {
                'total_assets': total_assets,
                'today_entries': today_entries,
                'available_categories': len(categories),
                'categories': categories,
            }
        )
