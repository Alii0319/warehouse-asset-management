from django.conf import settings
from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP'}


def validate_asset_photograph(file) -> None:
    """Validate uploaded image size and actual binary format via Pillow."""
    max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE_BYTES', 5 * 1024 * 1024)
    max_mb = getattr(settings, 'MAX_UPLOAD_SIZE_MB', 5)

    if file.size > max_bytes:
        raise ValidationError(f'Image file size must not exceed {max_mb} MB.')

    try:
        file.seek(0)
        with Image.open(file) as img:
            img_format = (img.format or '').upper()
            img.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError('Upload a valid image file (JPEG, PNG, or WebP).') from exc
    finally:
        file.seek(0)

    if img_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            f'Unsupported image format "{img_format or "unknown"}". Allowed formats: JPEG, PNG, WebP.'
        )
