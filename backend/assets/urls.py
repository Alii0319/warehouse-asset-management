from django.urls import path

from .views import AssetDetailView, AssetListCreateView, DashboardSummaryView

urlpatterns = [
    path('assets/', AssetListCreateView.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', AssetDetailView.as_view(), name='asset-detail'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
