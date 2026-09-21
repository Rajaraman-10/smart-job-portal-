from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('jobs', '0027_job_recruitment_workflow')]

    operations = [
        migrations.AddField(model_name='technicalquiz', name='access_token', field=models.CharField(blank=True, default='', max_length=96, unique=True)),
        migrations.AddField(model_name='technicalquiz', name='email_sent_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='technicalquiz', name='email_send_error', field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='technicalquiz', name='opened_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='technicalquiz', name='started_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='technicalquiz', name='submitted_at', field=models.DateTimeField(blank=True, null=True)),
    ]