import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Asset


def make_test_image(fmt: str = 'PNG', size: tuple[int, int] = (80, 80), filename: str = 'test.png') -> SimpleUploadedFile:
    buf = io.BytesIO()
    image = Image.new('RGB', size, color=(30, 120, 180))
    image.save(buf, format=fmt)
    buf.seek(0)
    content_type = {
        'PNG': 'image/png',
        'JPEG': 'image/jpeg',
        'WEBP': 'image/webp',
        'GIF': 'image/gif',
    }.get(fmt.upper(), 'application/octet-stream')
    return SimpleUploadedFile(filename, buf.read(), content_type=content_type)


TEMP_MEDIA_ROOT = tempfile.mkdtemp(prefix='warehouse_test_media_')


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class AssetAPITests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def test_create_valid_asset_and_auto_created_at(self):
        url = reverse('asset-list-create')
        payload = {
            'asset_id': 'AST-1001',
            'category': 'Forklift',
            'photograph': make_test_image('PNG', filename='forklift.png'),
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['asset_id'], 'AST-1001')
        self.assertEqual(response.data['category'], 'Forklift')
        self.assertEqual(response.data['source'], Asset.Source.MANUAL)
        self.assertIsNotNone(response.data['created_at'])
        self.assertIsNotNone(response.data['created_date'])
        self.assertIsNotNone(response.data['created_time'])
        self.assertIn('/media/assets/', response.data['photograph_url'])

    def test_backend_ignores_client_created_at(self):
        url = reverse('asset-list-create')
        payload = {
            'asset_id': 'AST-1002',
            'category': 'Pallet Jack',
            'photograph': make_test_image('JPEG', filename='jack.jpg'),
            'created_at': '2000-01-01T00:00:00Z',
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['created_date'].startswith('2000-01-01'))

    def test_asset_id_required(self):
        url = reverse('asset-list-create')
        payload = {
            'category': 'Scanner',
            'photograph': make_test_image('PNG'),
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('asset_id', response.data)

    def test_duplicate_asset_id_rejected_case_insensitive(self):
        url = reverse('asset-list-create')
        self.client.post(
            url,
            {
                'asset_id': 'AST-2001',
                'category': 'Racking',
                'photograph': make_test_image('PNG'),
            },
            format='multipart',
        )
        dup_response = self.client.post(
            url,
            {
                'asset_id': 'ast-2001',
                'category': 'Racking',
                'photograph': make_test_image('PNG'),
            },
            format='multipart',
        )
        self.assertEqual(dup_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('asset_id', dup_response.data)

    def test_category_required(self):
        url = reverse('asset-list-create')
        payload = {
            'asset_id': 'AST-3001',
            'photograph': make_test_image('WEBP', filename='item.webp'),
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', response.data)

    def test_invalid_file_upload_rejected(self):
        url = reverse('asset-list-create')
        fake_image = SimpleUploadedFile('fake.jpg', b'not-an-image-at-all', content_type='image/jpeg')
        response = self.client.post(
            url,
            {
                'asset_id': 'AST-4001',
                'category': 'Scanner',
                'photograph': fake_image,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('photograph', response.data)

    def test_unsupported_image_format_gif_rejected(self):
        url = reverse('asset-list-create')
        gif_image = make_test_image('GIF', filename='anim.gif')
        response = self.client.post(
            url,
            {
                'asset_id': 'AST-4002',
                'category': 'Scanner',
                'photograph': gif_image,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('photograph', response.data)

    @override_settings(MAX_UPLOAD_SIZE_BYTES=1024, MAX_UPLOAD_SIZE_MB=1)
    def test_oversized_file_rejected(self):
        url = reverse('asset-list-create')
        large_img = make_test_image('PNG', size=(800, 800), filename='large.png')
        self.assertGreater(large_img.size, 1024)
        response = self.client.post(
            url,
            {
                'asset_id': 'AST-4003',
                'category': 'Conveyor',
                'photograph': large_img,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('photograph', response.data)

    def test_list_search_and_detail_retrieval(self):
        url = reverse('asset-list-create')
        r1 = self.client.post(
            url,
            {
                'asset_id': 'AST-5001',
                'category': 'Forklift',
                'photograph': make_test_image('PNG', filename='a1.png'),
            },
            format='multipart',
        )
        self.client.post(
            url,
            {
                'asset_id': 'WH-9002',
                'category': 'Scanner',
                'photograph': make_test_image('WEBP', filename='a2.webp'),
                'source': Asset.Source.AUTOMATED,
                'external_reference': 'RFID-9988',
            },
            format='multipart',
        )

        list_resp = self.client.get(url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(list_resp.data['count'], 2)

        search_resp = self.client.get(url, {'search': 'ast-50'})
        self.assertEqual(search_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(search_resp.data['count'], 1)
        self.assertEqual(search_resp.data['results'][0]['asset_id'], 'AST-5001')

        detail_url = reverse('asset-detail', kwargs={'pk': r1.data['id']})
        detail_resp = self.client.get(detail_url)
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_resp.data['asset_id'], 'AST-5001')

        # Verify media URL is accessible
        media_path = '/' + detail_resp.data['photograph_url'].split('/', 3)[-1]
        media_resp = self.client.get(media_path)
        self.assertEqual(media_resp.status_code, status.HTTP_200_OK)

    def test_dashboard_summary_statistics(self):
        list_url = reverse('asset-list-create')
        self.client.post(
            list_url,
            {
                'asset_id': 'AST-6001',
                'category': 'Forklift',
                'photograph': make_test_image('PNG'),
            },
            format='multipart',
        )
        self.client.post(
            list_url,
            {
                'asset_id': 'AST-6002',
                'category': 'Scanner',
                'photograph': make_test_image('JPEG', filename='s.jpg'),
            },
            format='multipart',
        )
        self.client.post(
            list_url,
            {
                'asset_id': 'AST-6003',
                'category': 'Forklift',
                'photograph': make_test_image('PNG'),
            },
            format='multipart',
        )

        summary_resp = self.client.get(reverse('dashboard-summary'))
        self.assertEqual(summary_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_resp.data['total_assets'], 3)
        self.assertEqual(summary_resp.data['today_entries'], 3)
        self.assertEqual(summary_resp.data['available_categories'], 2)
        self.assertEqual(summary_resp.data['categories'], ['Forklift', 'Scanner'])
