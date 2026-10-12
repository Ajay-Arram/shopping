from django.core.management.base import BaseCommand
from products.services.product_api import ProductAPIService


class Command(BaseCommand):
    help = 'Synchronizes products from the authorized external product API into MySQL'

    def add_arguments(self, parser):
        parser.add_argument('--query', type=str, default=None, help='Search keyword to query')
        parser.add_argument('--category', type=str, default=None, help='Category name to query')

    def handle(self, *args, **options):
        query = options.get('query')
        category = options.get('category')
        self.stdout.write(self.style.NOTICE(f"Starting product sync from authorized API (query={query}, category={category})..."))

        service = ProductAPIService()
        result = service.sync_products(query=query, category_name=category)

        self.stdout.write(self.style.SUCCESS(
            f"Sync complete!\n"
            f"Source: {result['source']}\n"
            f"Created: {result['created']}\n"
            f"Updated: {result['updated']}\n"
            f"Processed: {result['total_processed']}"
        ))
