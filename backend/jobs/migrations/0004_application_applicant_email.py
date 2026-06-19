from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_application_applicant_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='applicant_email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
    ]
