from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0004_application_applicant_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='salary',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
