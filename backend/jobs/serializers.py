from rest_framework import serializers
from .models import Conversation, Job, Application, Message, Company, RecruiterProfile, UserProfile, Bookmark, Interview, Notification
from django.contrib.auth.models import User
from django.db.models import Q

from .status_utils import normalize_application_status, to_display_application_status

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            'id',
            'application',
            'recruiter',
            'candidate',
            'interview_date',
            'interview_time',
            'meeting_link',
            'meeting_url',
            'room_name',
            'interview_mode',
            'interviewer_name',
            'notes',
            'status',
            'created_at',
        ]
        read_only_fields = ['recruiter', 'candidate', 'meeting_url', 'room_name', 'created_at']


class BookmarkSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'job', 'job_title', 'job_company', 'job_location', 'created_at']
        read_only_fields = ['user']

    def validate(self, attrs):
        user = self.context['request'].user
        job = attrs.get('job')
        if Bookmark.objects.filter(user=user, job=job).exists():
            raise serializers.ValidationError('Job is already saved')
        return attrs


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'logo',
            'cover_image',
            'website',
            'industry',
            'size',
            'description',
            'location',
            'employees',
            'rating',
            'created_at',
        ]


class JobSerializer(serializers.ModelSerializer):
    company_meta = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id',
            'recruiter',
            'title',
            'company',
            'location',
            'salary',
            'description',
            'category',
            'required_skills',
            'status',
            'company_meta',
            'posted_at',
        ]
        read_only_fields = ['recruiter', 'posted_at']

    def _get_company(self, name):
        if not hasattr(self, '_company_cache'):
            self._company_cache = {}
        key = (name or '').lower()
        if key not in self._company_cache:
            self._company_cache[key] = Company.objects.filter(name__iexact=name).first()
        return self._company_cache[key]

    def get_company_meta(self, obj):
        fallback = {}
        company = self._get_company(obj.company)
        if company:
            fallback = {
                'name': company.name,
                'logo': company.logo,
                'cover_image': company.cover_image,
                'website': company.website,
                'industry': company.industry,
                'size': company.size,
                'description': company.description,
                'employees': company.employees,
                'rating': company.rating,
                'location': company.location,
            }
        else:
            fallback = {
                'name': obj.company,
                'logo': '',
                'cover_image': '',
                'website': '',
                'industry': '',
                'size': '',
                'description': '',
                'employees': '',
                'rating': None,
                'location': obj.location,
            }

        if not obj.company_meta:
            return fallback

        meta = obj.company_meta or {}
        if any((meta.get(field) or '').strip() for field in ['logo', 'cover_image', 'website', 'industry', 'size', 'description', 'employees']) or meta.get('rating') is not None:
            return {
                'name': meta.get('name') or fallback['name'],
                'logo': meta.get('logo') or fallback['logo'],
                'cover_image': meta.get('cover_image') or fallback['cover_image'],
                'website': meta.get('website') or fallback['website'],
                'industry': meta.get('industry') or fallback['industry'],
                'size': meta.get('size') or fallback['size'],
                'description': meta.get('description') or fallback['description'],
                'employees': meta.get('employees') or fallback['employees'],
                'rating': meta.get('rating') if meta.get('rating') is not None else fallback['rating'],
                'location': meta.get('location') or fallback['location'],
            }

        return fallback

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    conversation = serializers.PrimaryKeyRelatedField(queryset=Conversation.objects.all(), required=False, allow_null=True)
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.all(), required=False, write_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'application', 'sender', 'sender_name', 'sender_type', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender_name', 'created_at', 'sender', 'is_read', 'sender_type']

    def validate(self, attrs):
        conversation = attrs.get('conversation')
        application = attrs.get('application')

        if conversation and application:
            raise serializers.ValidationError({'application': 'Provide either conversation or application, not both.'})
        if not conversation and not application:
            raise serializers.ValidationError({'conversation': 'A conversation is required.'})

        if application:
            conversation_obj = Conversation.objects.filter(application=application).first()
            if not conversation_obj:
                conversation_obj = Conversation.objects.create(
                    application=application,
                    job_seeker=application.applicant,
                    recruiter=application.job.recruiter,
                )
            attrs['conversation'] = conversation_obj

        return attrs

    def create(self, validated_data):
        validated_data.pop('application', None)
        return super().create(validated_data)

    def get_sender_name(self, obj):
        return obj.sender.first_name or obj.sender.username


class ConversationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='job_seeker.first_name', read_only=True)
    recruiter_name = serializers.CharField(source='recruiter.first_name', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    job_company = serializers.CharField(source='application.job.company', read_only=True)
    unread_messages = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'application',
            'job_seeker',
            'recruiter',
            'applicant_name',
            'recruiter_name',
            'job_title',
            'job_company',
            'created_at',
            'updated_at',
            'unread_messages',
        ]
        read_only_fields = ['job_seeker', 'recruiter', 'created_at', 'updated_at', 'unread_messages']

    def get_unread_messages(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company', read_only=True)
    applicant_name = serializers.CharField(required=False, allow_blank=True)
    applicant_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    resume_file = serializers.FileField(required=False, allow_null=True)
    messages = MessageSerializer(source='conversation.messages', many=True, read_only=True)
    interviews = InterviewSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    unread_message_count = serializers.SerializerMethodField()
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    has_conversation = serializers.SerializerMethodField()

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
            'skills',
            'ai_match_score',
            'ai_matched_skills',
            'ai_missing_skills',
            'status',
            'applied_at',
            'viewed_at',
            'messages',
            'interviews',
            'message_count',
            'unread_message_count',
            'has_conversation',
            'conversation_id',
        ]
        read_only_fields = ['job_title', 'job_company', 'applicant', 'message_count', 'unread_message_count', 'has_conversation', 'ai_match_score', 'ai_matched_skills', 'ai_missing_skills']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'status' in data:
            data['status'] = to_display_application_status(normalize_application_status(data['status']))
        return data

    def get_message_count(self, obj):
        conversation = getattr(obj, 'conversation', None)
        if not conversation:
            return 0
        return conversation.messages.count()

    def get_unread_message_count(self, obj):
        request = self.context.get('request')
        conversation = getattr(obj, 'conversation', None)
        if not conversation or not request or not request.user.is_authenticated:
            return 0
        return conversation.messages.filter(is_read=False).exclude(sender=request.user).count()

    def get_has_conversation(self, obj):
        return getattr(obj, 'conversation', None) is not None


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    user_type = serializers.ChoiceField(choices=['jobseeker', 'recruiter'])
    company_name = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    company_website = serializers.CharField(required=False, allow_blank=True)
    company_industry = serializers.CharField(required=False, allow_blank=True)
    company_size = serializers.CharField(required=False, allow_blank=True)
    company_description = serializers.CharField(required=False, allow_blank=True)
    company_location = serializers.CharField(required=False, allow_blank=True)
    company_logo = serializers.CharField(required=False, allow_blank=True)
    company_cover_image = serializers.CharField(required=False, allow_blank=True)
    company_employees = serializers.CharField(required=False, allow_blank=True)
    company_rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, allow_null=True, default=None)

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(Q(email__iexact=normalized_email) | Q(username__iexact=normalized_email)).exists():
            raise serializers.ValidationError("Email already registered")
        return normalized_email

    def validate(self, attrs):
        user_type = attrs.get('user_type')
        if user_type == 'recruiter':
            company_name = (attrs.get('company_name') or '').strip()
            if not company_name:
                raise serializers.ValidationError({'company_name': 'Company name is required for recruiters.'})
        return attrs

    def create(self, validated_data):
        normalized_email = validated_data['email'].strip().lower()
        user_type = validated_data.get('user_type', 'jobseeker')
        user = User.objects.create_user(
            username=normalized_email,
            email=normalized_email,
            password=validated_data['password'],
            first_name=validated_data['name'],
            last_name=user_type  # Store user_type in last_name
        )

        if user_type == 'recruiter':
            company_name = validated_data.get('company_name', '').strip()
            if company_name:
                company, _ = Company.objects.get_or_create(name=company_name)
                company.website = validated_data.get('company_website', company.website) or company.website
                company.industry = validated_data.get('company_industry', company.industry) or company.industry
                company.size = validated_data.get('company_size', company.size) or company.size
                company.description = validated_data.get('company_description', company.description) or company.description
                company.location = validated_data.get('company_location', company.location) or company.location
                company.logo = validated_data.get('company_logo', company.logo) or company.logo
                company.cover_image = validated_data.get('company_cover_image', company.cover_image) or company.cover_image
                company.employees = validated_data.get('company_employees', company.employees) or company.employees
                if validated_data.get('company_rating') is not None:
                    company.rating = validated_data.get('company_rating')
                company.save()

                profile, _ = RecruiterProfile.objects.get_or_create(
                    user=user,
                    defaults={'company': company},
                )
                if profile.company_id != company.id:
                    profile.company = company
                    profile.save(update_fields=['company'])

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'mobile_number',
            'profile_photo',
            'headline',
            'dob',
            'gender',
            'city',
            'state',
            'country',
            'career_level',
            'total_experience',
            'current_company',
            'current_job_title',
            'current_salary',
            'expected_salary',
            'notice_period',
            'preferred_job_type',
            'preferred_work_mode',
            'education',
            'skills',
            'resume_headline',
            'resume_last_updated',
            'projects',
            'work_experience',
            'certifications',
            'languages',
            'social_links',
            'preferences',
            'privacy_settings',
            'resume_file',
            'email_notifications',
            'profile_completed',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'link', 'is_read', 'created_at']
        read_only_fields = ['user', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company_name', 'profile']

    def get_company_name(self, obj):
        profile = getattr(obj, 'recruiter_profile', None)
        return profile.company.name if profile and profile.company else None

    def get_role(self, obj):
        return obj.last_name if obj.last_name in ['jobseeker', 'recruiter', 'admin'] else 'jobseeker'
