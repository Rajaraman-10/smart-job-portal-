from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0009_application_viewed_at_alter_application_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='company_meta',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
