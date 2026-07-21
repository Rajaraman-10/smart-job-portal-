from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0015_add_resume_file_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_notifications',
            field=models.BooleanField(default=True),
        ),
    ]
