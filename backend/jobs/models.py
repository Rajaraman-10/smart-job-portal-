from django.conf import settings
from django.db import models
from django.utils import timezone

import random


class LoginOTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from datetime import timedelta
        return not self.is_used and timezone.now() < self.created_at + timedelta(minutes=5)

    @staticmethod
    def generate_code():
        return f"{random.randint(100000, 999999)}"

    def __str__(self):
        return f"OTP for {self.email}"


class OTP(models.Model):
    mobile_number = models.CharField(max_length=15, unique=True)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def is_expired(self):
        from datetime import timedelta
        return timezone.now() - self.created_at > timedelta(minutes=10)
    
    def __str__(self):
        return f"OTP for {self.mobile_number}"

class Job(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_CLOSED = 'CLOSED'
    STATUS_DRAFT = 'DRAFT'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_DRAFT, 'Draft'),
    ]
    EXPERIENCE_LEVEL_CHOICES = [
        ('Entry', 'Entry Level'),
        ('Mid', 'Mid Level'),
        ('Senior', 'Senior Level'),
        ('Lead', 'Lead / Manager'),
    ]
    WORK_MODE_CHOICES = [
        ('Remote', 'Remote'),
        ('Hybrid', 'Hybrid'),
        ('On-site', 'On-site'),
    ]

    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField()
    category = models.CharField(max_length=100, blank=True, default='General')
    required_skills = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    company_meta = models.JSONField(blank=True, null=True, default=dict)
    posted_at = models.DateTimeField(auto_now_add=True)

    # Structured filter fields (in addition to the free-text `salary`/`location` shown to
    # everyone) — optional on the recruiter's part, used for search filtering when set.
    salary_min = models.PositiveIntegerField(blank=True, null=True)
    salary_max = models.PositiveIntegerField(blank=True, null=True)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, blank=True, default='')
    work_mode = models.CharField(max_length=20, choices=WORK_MODE_CHOICES, blank=True, default='')
    screening_threshold = models.PositiveIntegerField(default=50)
    resume_screening_at = models.DateTimeField(blank=True, null=True)
    quiz_starts_at = models.DateTimeField(blank=True, null=True)
    quiz_ends_at = models.DateTimeField(blank=True, null=True)
    quiz_duration_minutes = models.PositiveIntegerField(default=60)
    quiz_instructions = models.TextField(blank=True, default='')
    technical_interview_at = models.DateTimeField(blank=True, null=True)
    technical_interview_mode = models.CharField(max_length=50, blank=True, default='Video')
    technical_interview_link = models.CharField(max_length=500, blank=True, default='')
    technical_interview_instructions = models.TextField(blank=True, default='')
    final_selection_at = models.DateTimeField(blank=True, null=True)
    quiz_question_pdf = models.FileField(upload_to='quiz_question_sets/', blank=True, null=True)
    quiz_questions = models.JSONField(default=list, blank=True)
    quiz_questions_status = models.CharField(max_length=30, default='NOT_UPLOADED')

    def __str__(self):
        return f"{self.title} at {self.company}"

class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('RECRUITER_VIEWED', 'Recruiter Viewed'),
        ('SHORTLISTED', 'Shortlisted'),
        ('RESUME_SHORTLISTED', 'Resume Shortlisted'),
        ('RESUME_REJECTED', 'Resume Rejected'),
        ('QUIZ_SCHEDULED', 'Quiz Scheduled'),
        ('QUIZ_COMPLETED', 'Quiz Completed'),
        ('QUIZ_PASSED', 'Quiz Passed'),
        ('QUIZ_NOT_CLEARED', 'Quiz Not Cleared'),
        ('INTERVIEW_SCHEDULED', 'Interview Scheduled'),
        ('INTERVIEW_COMPLETED', 'Interview Completed'),
        ('TECHNICAL_INTERVIEW_COMPLETED', 'Technical Interview Completed'),
        ('TECHNICAL_INTERVIEW_PASSED', 'Technical Interview Passed'),
        ('TECHNICAL_INTERVIEW_NOT_CLEARED', 'Technical Interview Not Cleared'),
        ('SELECTED', 'Selected'),
        ('REJECTED', 'Rejected'),
        ('ON_HOLD', 'On Hold'),
        ('OFFER_SENT', 'Offer Sent'),
        ('JOINED', 'Joined'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    applicant_name = models.CharField(max_length=255, blank=True, default='')
    applicant_email = models.EmailField(blank=True, default='')
    resume = models.TextField(blank=True)
    resume_file = models.FileField(upload_to='resumes/', blank=True, null=True)
    cover_letter = models.TextField(blank=True)
    skills = models.CharField(max_length=500, blank=True, default='')
    ai_match_score = models.FloatField(blank=True, null=True)
    ai_matched_skills = models.JSONField(blank=True, default=list)
    ai_missing_skills = models.JSONField(blank=True, default=list)
    ai_scanned_at = models.DateTimeField(blank=True, null=True)
    resume_edit_count = models.PositiveIntegerField(default=0)
    applied_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=50,
        choices=APPLICATION_STATUS_CHOICES,
        default='APPLIED',
    )

    def __str__(self):
        return f"Application by {self.applicant_name or self.applicant} for {self.job}"


class Company(models.Model):
    LOGO_STATUS_CHOICES = [
        ('none', 'None'),
        ('pending', 'Pending Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    ADMIN_REVIEW_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    cover_image = models.CharField(max_length=512, blank=True, default='')
    website = models.URLField(blank=True, default='')
    industry = models.CharField(max_length=255, blank=True, default='')
    size = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    employees = models.CharField(max_length=100, blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Company details (registration onboarding)
    address = models.CharField(max_length=300, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='India')
    year_founded = models.PositiveIntegerField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, default='')
    registration_number = models.CharField(max_length=100, blank=True, default='')  # CIN
    gstin = models.CharField(max_length=50, blank=True, default='')

    # Verification
    logo_status = models.CharField(max_length=20, choices=LOGO_STATUS_CHOICES, default='none')
    website_verified = models.BooleanField(default=False)
    registration_verified = models.BooleanField(default=False)
    address_verified = models.BooleanField(default=False)
    admin_review_status = models.CharField(max_length=20, choices=ADMIN_REVIEW_STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.name

class RecruiterProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recruiter_profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='recruiters')
    created_at = models.DateTimeField(auto_now_add=True)

    job_title = models.CharField(max_length=150, blank=True, default='')
    phone_number = models.CharField(max_length=30, blank=True, default='')
    linkedin_url = models.CharField(max_length=300, blank=True, default='')
    profile_photo = models.ImageField(upload_to='recruiter_photos/', blank=True, null=True)

    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    identity_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} -> {self.company}"

class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    CAREER_LEVEL_CHOICES = [
        ('Fresher', 'Fresher'),
        ('Experienced', 'Experienced'),
    ]
    WORK_MODE_CHOICES = [
        ('On-site', 'On-site'),
        ('Hybrid', 'Hybrid'),
        ('Remote', 'Remote'),
    ]
    JOB_TYPE_CHOICES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Internship', 'Internship'),
        ('Contract', 'Contract'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    mobile_number = models.CharField(max_length=20, blank=True, default='')
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    headline = models.CharField(max_length=255, blank=True, default='')
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    career_level = models.CharField(max_length=50, choices=CAREER_LEVEL_CHOICES, blank=True, default='')
    total_experience = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    current_company = models.CharField(max_length=255, blank=True, default='')
    current_job_title = models.CharField(max_length=255, blank=True, default='')
    current_salary = models.CharField(max_length=100, blank=True, default='')
    expected_salary = models.CharField(max_length=100, blank=True, default='')
    notice_period = models.CharField(max_length=100, blank=True, default='')
    preferred_job_type = models.CharField(max_length=100, choices=JOB_TYPE_CHOICES, blank=True, default='')
    preferred_work_mode = models.CharField(max_length=100, choices=WORK_MODE_CHOICES, blank=True, default='')
    education = models.JSONField(blank=True, null=True, default=list)
    skills = models.JSONField(blank=True, null=True, default=list)
    resume_headline = models.CharField(max_length=255, blank=True, default='')
    resume_last_updated = models.DateField(blank=True, null=True)
    projects = models.JSONField(blank=True, null=True, default=list)
    work_experience = models.JSONField(blank=True, null=True, default=list)
    certifications = models.JSONField(blank=True, null=True, default=list)
    languages = models.JSONField(blank=True, null=True, default=list)
    social_links = models.JSONField(blank=True, null=True, default=dict)
    preferences = models.JSONField(blank=True, null=True, default=dict)
    privacy_settings = models.JSONField(blank=True, null=True, default=dict)
    resume_file = models.FileField(upload_to='resumes/', blank=True, null=True)
    email_notifications = models.BooleanField(default=True)
    profile_completed = models.BooleanField(default=False)
    is_subscribed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile for {self.user}"


class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/profile/')
    label = models.CharField(max_length=255, blank=True, default='')
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.label or self.file.name} ({self.user})"


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')

    def __str__(self):
        return f"{self.user} bookmarked {self.job}"


class Conversation(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='conversation')
    job_seeker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobseeker_conversations')
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recruiter_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation for {self.application}"


class Interview(models.Model):
    STATUS_SCHEDULED = 'SCHEDULED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_RESCHEDULED = 'RESCHEDULED'
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_RESCHEDULED, 'Rescheduled'),
    ]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interviews', null=True, blank=True)
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='candidate_interviews', null=True, blank=True)
    interview_date = models.DateField(null=True, blank=True)
    interview_time = models.TimeField(null=True, blank=True)
    meeting_link = models.CharField(max_length=500, blank=True, default='')
    meeting_url = models.URLField(blank=True, default='')
    room_name = models.CharField(max_length=255, blank=True, default='')
    interview_mode = models.CharField(max_length=50, blank=True, default='')
    interviewer_name = models.CharField(max_length=255, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview for {self.application}"


class InterviewFeedback(models.Model):
    RECOMMENDATION_CHOICES = [
        ('STRONG_YES', 'Strong yes'),
        ('YES', 'Yes'),
        ('MAYBE', 'Maybe'),
        ('NO', 'No'),
    ]

    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedback')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interview_feedback')
    technical_rating = models.PositiveSmallIntegerField(default=0)
    communication_rating = models.PositiveSmallIntegerField(default=0)
    culture_rating = models.PositiveSmallIntegerField(default=0)
    overall_rating = models.PositiveSmallIntegerField(default=0)
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES, default='MAYBE')
    strengths = models.TextField(blank=True, default='')
    concerns = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['interview', 'reviewer'], name='unique_interview_feedback_reviewer'),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"Feedback for {self.interview} by {self.reviewer}"


class Reminder(models.Model):
    TYPE_CHOICES = [
        ('INTERVIEW_24H', 'Interview 24 hours before'),
        ('INTERVIEW_1H', 'Interview 1 hour before'),
        ('CUSTOM', 'Custom reminder'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]

    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='reminders', null=True, blank=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='reminders')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='CUSTOM')
    scheduled_for = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(blank=True, null=True)
    last_error = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['interview', 'recipient', 'reminder_type'], name='unique_interview_reminder_recipient_type'),
        ]
        ordering = ['scheduled_for']

    def __str__(self):
        return f"{self.reminder_type} for {self.recipient}"


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    billing_interval = models.CharField(max_length=20, default='month')
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('PAST_DUE', 'Past due'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    provider = models.CharField(max_length=30, default='manual')
    provider_customer_id = models.CharField(max_length=255, blank=True, default='')
    provider_subscription_id = models.CharField(max_length=255, blank=True, default='')
    current_period_start = models.DateTimeField(blank=True, null=True)
    current_period_end = models.DateTimeField(blank=True, null=True)
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.plan}"


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('PENDING', 'Pending'),
        ('SUCCEEDED', 'Succeeded'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_transactions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    provider = models.CharField(max_length=30, default='manual')
    provider_payment_id = models.CharField(max_length=255, blank=True, default='')
    idempotency_key = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.idempotency_key}"


class TechnicalQuiz(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_PUBLISHED = 'PUBLISHED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='technical_quiz')
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_technical_quizzes')
    questions = models.JSONField(default=list, blank=True)
    passing_score = models.PositiveIntegerField(default=70)
    score = models.FloatField(blank=True, null=True)
    answers = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    access_token = models.CharField(max_length=96, unique=True, blank=True, default='')
    email_sent_at = models.DateTimeField(blank=True, null=True)
    email_send_error = models.TextField(blank=True, default='')
    opened_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Technical quiz for {self.application}"


class OfferLetter(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_SENT = 'SENT'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_DECLINED = 'DECLINED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SENT, 'Sent'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
    ]

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='offer_letter')
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='offer_letters')
    salary = models.CharField(max_length=255)
    joining_date = models.DateField()
    terms = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    sent_at = models.DateTimeField(blank=True, null=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Offer letter for {self.application}"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, blank=True, default='')
    link = models.CharField(max_length=500, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user}: {self.title}"


class Message(models.Model):
    SENDER_JOBSEEKER = 'jobseeker'
    SENDER_RECRUITER = 'recruiter'
    SENDER_TYPE_CHOICES = [
        (SENDER_JOBSEEKER, 'Job Seeker'),
        (SENDER_RECRUITER, 'Recruiter'),
    ]

    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE, null=True, blank=True)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES, blank=True, default='jobseeker')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} in {self.conversation}"


class AdminAuditLog(models.Model):
    """Trail of moderation actions an admin took, so decisions (suspend, verify,
    close a job, ...) aren't invisible once the underlying row changes again."""

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='admin_audit_actions'
    )
    action = models.CharField(max_length=50)
    target_type = models.CharField(max_length=50)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    target_label = models.CharField(max_length=255, blank=True, default='')
    details = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} on {self.target_type}#{self.target_id} by {self.admin}"
