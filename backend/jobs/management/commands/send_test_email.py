from django.core.management.base import BaseCommand
from django.core.mail import send_mail


class Command(BaseCommand):
    help = 'Send a test email using the configured SMTP settings'

    def add_arguments(self, parser):
        parser.add_argument('--to', default='your-email@example.com')
        parser.add_argument('--subject', default='Smart Job Portal test email')
        parser.add_argument('--message', default='This is a test email from Smart Job Portal.')

    def handle(self, *args, **options):
        send_mail(
            options['subject'],
            options['message'],
            None,
            [options['to']],
            fail_silently=False,
        )
        self.stdout.write(self.style.SUCCESS(f'Sent test email to {options["to"]}'))
