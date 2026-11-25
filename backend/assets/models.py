import os
import uuid
from django.db import models


def asset_photograph_upload_path(instance, filename: str) -> str:
    """Organize uploaded asset photographs by date with collision-free filenames."""
    _, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else '.jpg'
    return f'assets/%Y/%m/%d/{uuid.uuid4().hex}{ext}'


def _upload_path_with_date(instance, filename: str) -> str:
    from django.utils import timezone

    now = timezone.localtime(timezone.now())
    _, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else '.jpg'
    return f'assets/{now:%Y/%m/%d}/{uuid.uuid4().hex}{ext}'


class Asset(models.Model):
    """Represents a unique physical warehouse asset."""

    class Source(models.TextChoices):
        MANUAL = 'MANUAL', 'Manual'
        AUTOMATED = 'AUTOMATED', 'Automated'

    asset_id = models.CharField(max_length=100, unique=True, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    photograph = models.ImageField(upload_to=_upload_path_with_date)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL,
    )
    external_reference = models.CharField(max_length=255, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self) -> str:
        return f'{self.asset_id} ({self.category})'
