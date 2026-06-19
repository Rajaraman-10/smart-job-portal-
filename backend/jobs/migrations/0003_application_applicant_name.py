from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_application_resume_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='applicant_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
