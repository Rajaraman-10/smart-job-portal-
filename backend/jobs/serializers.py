from rest_framework import serializers
from .models import Job, Application
from django.contrib.auth.models import User
from django.db.models import Q

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['recruiter', 'posted_at']

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
            'viewed_at',
        ]
        read_only_fields = ['job_title', 'job_company', 'applicant']


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    user_type = serializers.ChoiceField(choices=['jobseeker', 'recruiter'])

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(Q(email__iexact=normalized_email) | Q(username__iexact=normalized_email)).exists():
            raise serializers.ValidationError("Email already registered")
        return normalized_email

    def create(self, validated_data):
        normalized_email = validated_data['email'].strip().lower()
        user = User.objects.create_user(
            username=normalized_email,
            email=normalized_email,
            password=validated_data['password'],
            first_name=validated_data['name'],
            last_name=validated_data.get('user_type', 'jobseeker')  # Store user_type in last_name
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
