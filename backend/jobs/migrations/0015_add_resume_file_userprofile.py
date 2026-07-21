from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0014_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='resume_file',
            field=models.FileField(upload_to='resumes/', blank=True, null=True),
        ),
    ]
