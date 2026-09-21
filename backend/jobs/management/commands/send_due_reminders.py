from django.core.management.base import BaseCommand

from jobs.views import process_due_reminders


class Command(BaseCommand):
    help = 'Send pending interview reminders that are due.'

    def handle(self, *args, **options):
        processed = process_due_reminders()
        self.stdout.write(self.style.SUCCESS(f'Processed {processed} reminder(s).'))
