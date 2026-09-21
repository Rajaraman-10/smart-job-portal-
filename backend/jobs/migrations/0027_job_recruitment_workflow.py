from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('jobs', '0026_technicalquiz_offerletter')]

    operations = [
        migrations.AddField(model_name='job', name='screening_threshold', field=models.PositiveIntegerField(default=50)),
        migrations.AddField(model_name='job', name='resume_screening_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='job', name='quiz_starts_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='job', name='quiz_ends_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='job', name='quiz_duration_minutes', field=models.PositiveIntegerField(default=60)),
        migrations.AddField(model_name='job', name='quiz_instructions', field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='job', name='technical_interview_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='job', name='technical_interview_mode', field=models.CharField(default='Video', max_length=50)),
        migrations.AddField(model_name='job', name='technical_interview_link', field=models.CharField(blank=True, default='', max_length=500)),
        migrations.AddField(model_name='job', name='technical_interview_instructions', field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='job', name='final_selection_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='job', name='quiz_question_pdf', field=models.FileField(blank=True, null=True, upload_to='quiz_question_sets/')),
        migrations.AddField(model_name='job', name='quiz_questions', field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='job', name='quiz_questions_status', field=models.CharField(default='NOT_UPLOADED', max_length=30)),
    ]