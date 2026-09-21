from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('jobs', '0025_adminauditlog'),
    ]

    operations = [
        migrations.CreateModel(
            name='TechnicalQuiz',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('questions', models.JSONField(blank=True, default=list)),
                ('passing_score', models.PositiveIntegerField(default=70)),
                ('score', models.FloatField(blank=True, null=True)),
                ('answers', models.JSONField(blank=True, default=dict)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('COMPLETED', 'Completed')], default='DRAFT', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='technical_quiz', to='jobs.application')),
                ('recruiter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_technical_quizzes', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='OfferLetter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('salary', models.CharField(max_length=255)),
                ('joining_date', models.DateField()),
                ('terms', models.TextField(blank=True, default='')),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('SENT', 'Sent'), ('ACCEPTED', 'Accepted'), ('DECLINED', 'Declined')], default='DRAFT', max_length=20)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='offer_letter', to='jobs.application')),
                ('recruiter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offer_letters', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]