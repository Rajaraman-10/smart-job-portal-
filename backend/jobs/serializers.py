from urllib.parse import urlparse

from rest_framework import serializers
from .models import Conversation, Job, Application, Message, Company, RecruiterProfile, UserProfile, Bookmark, Interview, InterviewFeedback, Notification, Resume, AdminAuditLog, TechnicalQuiz, OfferLetter, Reminder, SubscriptionPlan, Subscription, PaymentTransaction
from django.contrib.auth.models import User
from django.db.models import Q

from .status_utils import normalize_application_status, to_display_application_status


FREE_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'proton.me', 'rediffmail.com',
    'yandex.com', 'zoho.com', 'mail.com',
}

VERIFICATION_WEIGHTS = {
    'email_verified': 15,
    'phone_verified': 10,
    'identity_verified': 10,
    'website_verified': 15,
    'email_domain_match': 15,
    'registration_verified': 20,
    'address_verified': 10,
    'logo_verified': 5,
}


def _extract_domain(value):
    if not value:
        return ''
    value = value.strip().lower()
    if '@' in value:
        return value.split('@')[-1]
    if '://' not in value:
        value = f'//{value}'
    domain = (urlparse(value).netloc or '').split(':')[0]
    return domain[4:] if domain.startswith('www.') else domain


def get_email_domain_match(user_email, company_website):
    email_domain = _extract_domain(user_email)
    site_domain = _extract_domain(company_website)
    return bool(email_domain and site_domain and email_domain == site_domain)


def get_is_free_email(user_email):
    return _extract_domain(user_email) in FREE_EMAIL_DOMAINS


def compute_verification_score_for_company(company):
    recruiter_profile = company.recruiters.first()
    checks = {
        'email_verified': bool(recruiter_profile and recruiter_profile.email_verified),
        'phone_verified': bool(recruiter_profile and recruiter_profile.phone_verified),
        'identity_verified': bool(recruiter_profile and recruiter_profile.identity_verified),
        'website_verified': company.website_verified,
        'email_domain_match': bool(recruiter_profile and get_email_domain_match(recruiter_profile.user.email, company.website)),
        'registration_verified': company.registration_verified,
        'address_verified': company.address_verified,
        'logo_verified': company.logo_status == 'verified',
    }
    score = sum(VERIFICATION_WEIGHTS[key] for key, passed in checks.items() if passed)
    return score, checks


def get_verification_level(score):
    if score >= 90:
        return 'Highly Verified'
    if score >= 75:
        return 'Verified'
    if score >= 50:
        return 'Partially Verified'
    return 'Unverified'


def compute_profile_completion_for_company(company):
    recruiter_profile = company.recruiters.first()
    checks = [
        bool(company.name),
        bool(company.logo),
        bool(company.website),
        bool(company.phone),
        bool(company.address and company.city and company.state and company.country),
        bool(company.industry),
        bool(company.size),
        company.year_founded is not None,
        bool(company.description),
        bool(company.registration_number),
        bool(recruiter_profile and recruiter_profile.job_title),
        bool(recruiter_profile and recruiter_profile.phone_number),
    ]
    return round(100 * sum(checks) / len(checks))

class InterviewSerializer(serializers.ModelSerializer):
    feedback = serializers.SerializerMethodField()

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
            'feedback',
            'created_at',
        ]
        read_only_fields = ['recruiter', 'candidate', 'meeting_url', 'room_name', 'created_at']

    def get_feedback(self, obj):
        request = self.context.get('request')
        queryset = obj.feedback.all()
        if request and request.user.is_authenticated and get_user_role_for_serializer(request.user) != 'admin':
            queryset = queryset.filter(reviewer=request.user)
        return InterviewFeedbackSerializer(queryset, many=True).data


def get_user_role_for_serializer(user):
    return user.last_name if user.last_name in ['jobseeker', 'recruiter', 'admin'] else 'jobseeker'


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewFeedback
        fields = [
            'id', 'interview', 'reviewer', 'technical_rating', 'communication_rating',
            'culture_rating', 'overall_rating', 'recommendation', 'strengths',
            'concerns', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['reviewer', 'created_at', 'updated_at']

    def validate(self, attrs):
        for field in ['technical_rating', 'communication_rating', 'culture_rating', 'overall_rating']:
            value = attrs.get(field, 0)
            if value < 0 or value > 5:
                raise serializers.ValidationError({field: 'Rating must be between 0 and 5.'})
        return attrs


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ['id', 'interview', 'application', 'recipient', 'reminder_type', 'scheduled_for', 'status', 'sent_at', 'last_error', 'created_at']
        read_only_fields = ['recipient', 'status', 'sent_at', 'last_error', 'created_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'code', 'description', 'amount', 'currency', 'billing_interval', 'features', 'is_active']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'plan', 'status', 'provider', 'provider_customer_id', 'provider_subscription_id', 'current_period_start', 'current_period_end', 'cancel_at_period_end', 'created_at', 'updated_at']
        read_only_fields = fields


class PaymentTransactionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'user', 'plan', 'amount', 'currency', 'provider', 'provider_payment_id', 'idempotency_key', 'status', 'metadata', 'created_at', 'updated_at']
        read_only_fields = fields


class TechnicalQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalQuiz
        fields = ['id', 'application', 'recruiter', 'questions', 'passing_score', 'score', 'answers', 'status', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['recruiter', 'score', 'answers', 'status', 'completed_at', 'created_at', 'updated_at']


class OfferLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferLetter
        fields = ['id', 'application', 'recruiter', 'salary', 'joining_date', 'terms', 'status', 'sent_at', 'responded_at', 'created_at', 'updated_at']
        read_only_fields = ['application', 'recruiter', 'status', 'sent_at', 'responded_at', 'created_at', 'updated_at']


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'user', 'file', 'label', 'is_primary', 'uploaded_at']
        read_only_fields = ['user', 'is_primary']


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
    is_verified = serializers.SerializerMethodField()
    verification_score = serializers.SerializerMethodField()
    verification_level = serializers.SerializerMethodField()
    profile_completion_score = serializers.SerializerMethodField()
    recruiter_email = serializers.SerializerMethodField()
    recruiter_name = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'logo',
            'logo_status',
            'cover_image',
            'website',
            'industry',
            'size',
            'description',
            'location',
            'employees',
            'rating',
            'created_at',
            'address',
            'city',
            'state',
            'country',
            'year_founded',
            'phone',
            'registration_number',
            'gstin',
            'website_verified',
            'registration_verified',
            'address_verified',
            'admin_review_status',
            'admin_notes',
            'reviewed_at',
            'is_verified',
            'verification_score',
            'verification_level',
            'profile_completion_score',
            'recruiter_email',
            'recruiter_name',
        ]
        # Logo changes must go through the dedicated upload action (resets logo_status to
        # 'pending'); verification fields are only ever admin-set via the /verification/ action.
        read_only_fields = [
            'logo',
            'logo_status',
            'website_verified',
            'registration_verified',
            'address_verified',
            'admin_review_status',
            'admin_notes',
            'reviewed_at',
        ]

    def get_recruiter_email(self, obj):
        recruiter_profile = obj.recruiters.first()
        return recruiter_profile.user.email if recruiter_profile else ''

    def get_recruiter_name(self, obj):
        recruiter_profile = obj.recruiters.first()
        return recruiter_profile.user.first_name if recruiter_profile else ''

    def get_is_verified(self, obj):
        return obj.admin_review_status == 'approved'

    def get_verification_score(self, obj):
        score, _ = compute_verification_score_for_company(obj)
        return score

    def get_verification_level(self, obj):
        score, _ = compute_verification_score_for_company(obj)
        return get_verification_level(score)

    def get_profile_completion_score(self, obj):
        return compute_profile_completion_for_company(obj)


class RecruiterProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.first_name', read_only=True)
    profile_completion_score = serializers.SerializerMethodField()
    verification_score = serializers.SerializerMethodField()
    verification_level = serializers.SerializerMethodField()
    email_domain_match = serializers.SerializerMethodField()
    is_free_email = serializers.SerializerMethodField()

    class Meta:
        model = RecruiterProfile
        fields = [
            'id',
            'company',
            'email',
            'full_name',
            'job_title',
            'phone_number',
            'linkedin_url',
            'profile_photo',
            'email_verified',
            'phone_verified',
            'identity_verified',
            'profile_completion_score',
            'verification_score',
            'verification_level',
            'email_domain_match',
            'is_free_email',
        ]
        read_only_fields = ['email_verified', 'phone_verified', 'identity_verified']

    def get_profile_completion_score(self, obj):
        return compute_profile_completion_for_company(obj.company)

    def get_verification_score(self, obj):
        score, _ = compute_verification_score_for_company(obj.company)
        return score

    def get_verification_level(self, obj):
        score, _ = compute_verification_score_for_company(obj.company)
        return get_verification_level(score)

    def get_email_domain_match(self, obj):
        return get_email_domain_match(obj.user.email, obj.company.website)

    def get_is_free_email(self, obj):
        return get_is_free_email(obj.user.email)


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
            'salary_min',
            'salary_max',
            'experience_level',
            'work_mode',
            'screening_threshold',
            'resume_screening_at',
            'quiz_starts_at',
            'quiz_ends_at',
            'quiz_duration_minutes',
            'quiz_instructions',
            'technical_interview_at',
            'technical_interview_mode',
            'technical_interview_link',
            'technical_interview_instructions',
            'final_selection_at',
            'quiz_question_pdf',
            'quiz_questions',
            'quiz_questions_status',
        ]
        read_only_fields = ['recruiter', 'posted_at', 'quiz_question_pdf', 'quiz_questions', 'quiz_questions_status']

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
            # Only expose the logo to job seekers once an admin has verified it —
            # an unreviewed upload could be anything a recruiter dropped in.
            verified_logo_url = ''
            if company.logo and company.logo_status == 'verified':
                try:
                    verified_logo_url = company.logo.url
                except ValueError:
                    verified_logo_url = ''
            score, _ = compute_verification_score_for_company(company)
            fallback = {
                'name': company.name,
                'logo': verified_logo_url,
                'cover_image': company.cover_image,
                'website': company.website,
                'industry': company.industry,
                'size': company.size,
                'description': company.description,
                'employees': company.employees,
                'rating': company.rating,
                'location': company.location,
                'is_verified': company.admin_review_status == 'approved',
                'verification_score': score,
                'verification_level': get_verification_level(score),
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
                'is_verified': False,
                'verification_score': 0,
                'verification_level': get_verification_level(0),
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
                'is_verified': fallback['is_verified'],
                'verification_score': fallback['verification_score'],
                'verification_level': fallback['verification_level'],
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
    job_work_mode = serializers.CharField(source='job.work_mode', read_only=True)
    job_experience_level = serializers.CharField(source='job.experience_level', read_only=True)
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
            'job_work_mode',
            'job_experience_level',
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
            'resume_edit_count',
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
        read_only_fields = ['job_title', 'job_company', 'applicant', 'message_count', 'unread_message_count', 'has_conversation', 'ai_match_score', 'ai_matched_skills', 'ai_missing_skills', 'resume_edit_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'status' in data:
            data['status'] = normalize_application_status(data['status'])
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

    # Recruiter details
    job_title = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    linkedin_url = serializers.CharField(required=False, allow_blank=True)

    # Company details
    company_name = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    company_website = serializers.CharField(required=False, allow_blank=True)
    company_industry = serializers.CharField(required=False, allow_blank=True)
    company_size = serializers.CharField(required=False, allow_blank=True)
    company_description = serializers.CharField(required=False, allow_blank=True)
    company_location = serializers.CharField(required=False, allow_blank=True)
    company_cover_image = serializers.CharField(required=False, allow_blank=True)
    company_employees = serializers.CharField(required=False, allow_blank=True)
    company_address = serializers.CharField(required=False, allow_blank=True)
    company_city = serializers.CharField(required=False, allow_blank=True)
    company_state = serializers.CharField(required=False, allow_blank=True)
    company_country = serializers.CharField(required=False, allow_blank=True)
    company_year_founded = serializers.IntegerField(required=False, allow_null=True, default=None)
    company_phone = serializers.CharField(required=False, allow_blank=True)
    company_registration_number = serializers.CharField(required=False, allow_blank=True)
    company_gstin = serializers.CharField(required=False, allow_blank=True)

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
                company.cover_image = validated_data.get('company_cover_image', company.cover_image) or company.cover_image
                company.employees = validated_data.get('company_employees', company.employees) or company.employees
                company.address = validated_data.get('company_address', company.address) or company.address
                company.city = validated_data.get('company_city', company.city) or company.city
                company.state = validated_data.get('company_state', company.state) or company.state
                company.country = validated_data.get('company_country', company.country) or company.country
                company.phone = validated_data.get('company_phone', company.phone) or company.phone
                company.registration_number = validated_data.get('company_registration_number', company.registration_number) or company.registration_number
                company.gstin = validated_data.get('company_gstin', company.gstin) or company.gstin
                if validated_data.get('company_year_founded') is not None:
                    company.year_founded = validated_data.get('company_year_founded')
                company.save()

                profile, _ = RecruiterProfile.objects.get_or_create(
                    user=user,
                    defaults={'company': company},
                )
                if profile.company_id != company.id:
                    profile.company = company
                profile.job_title = validated_data.get('job_title', profile.job_title) or profile.job_title
                profile.phone_number = validated_data.get('phone_number', profile.phone_number) or profile.phone_number
                profile.linkedin_url = validated_data.get('linkedin_url', profile.linkedin_url) or profile.linkedin_url
                profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    profile_completion_score = serializers.SerializerMethodField()
    resumes = serializers.SerializerMethodField()

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
            'is_subscribed',
            'profile_completion_score',
            'resumes',
        ]
        read_only_fields = ['is_subscribed']

    def get_profile_completion_score(self, obj):
        checks = [
            bool(obj.mobile_number),
            bool(obj.headline),
            bool(obj.city),
            bool(obj.country),
            bool(obj.career_level),
            obj.total_experience is not None,
            bool(obj.current_job_title),
            bool(obj.current_company),
            bool(obj.expected_salary),
            bool(obj.preferred_job_type),
            bool(obj.preferred_work_mode),
            bool(obj.skills),
            bool(obj.education),
            bool(obj.work_experience),
            obj.user.resumes.exists() or bool(obj.resume_file),
        ]
        return round(100 * sum(checks) / len(checks))

    def get_resumes(self, obj):
        return ResumeSerializer(obj.user.resumes.all(), many=True, context=self.context).data


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
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company_name', 'profile', 'is_active', 'date_joined']

    def get_company_name(self, obj):
        profile = getattr(obj, 'recruiter_profile', None)
        return profile.company.name if profile and profile.company else None

    def get_role(self, obj):
        return obj.last_name if obj.last_name in ['jobseeker', 'recruiter', 'admin'] else 'jobseeker'


class AdminAuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    admin_email = serializers.EmailField(source='admin.email', read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = [
            'id', 'admin_name', 'admin_email', 'action', 'target_type',
            'target_id', 'target_label', 'details', 'created_at',
        ]

    def get_admin_name(self, obj):
        if not obj.admin:
            return 'Deleted admin'
        return obj.admin.first_name or obj.admin.username
