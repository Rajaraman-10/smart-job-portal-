from rest_framework import serializers
from .models import Job, Application
from django.contrib.auth.models import User

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company', read_only=True)
    applicant_name = serializers.CharField(required=False, allow_blank=True)
    applicant_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    resume_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'job_title',
            'job_company',
            'applicant',
            'applicant_name',
            'applicant_email',
            'resume',
            'resume_file',
            'cover_letter',
            'status',
            'applied_at',
        ]
        read_only_fields = ['job_title', 'job_company']


class SendOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=15)


class VerifyOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)
    user_type = serializers.ChoiceField(choices=['jobseeker', 'recruiter'])

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
