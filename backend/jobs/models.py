from django.conf import settings
from django.db import models
from django.utils import timezone

import random
import string


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

    def __str__(self):
        return f"{self.title} at {self.company}"

class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('RECRUITER_VIEWED', 'Recruiter Viewed'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW_SCHEDULED', 'Interview Scheduled'),
        ('INTERVIEW_COMPLETED', 'Interview Completed'),
        ('SELECTED', 'Selected'),
        ('REJECTED', 'Rejected'),
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
    name = models.CharField(max_length=255, unique=True)
    logo = models.CharField(max_length=512, blank=True, default='')
    cover_image = models.CharField(max_length=512, blank=True, default='')
    website = models.URLField(blank=True, default='')
    industry = models.CharField(max_length=255, blank=True, default='')
    size = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    employees = models.CharField(max_length=100, blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class RecruiterProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recruiter_profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='recruiters')
    created_at = models.DateTimeField(auto_now_add=True)

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
    profile_photo = models.CharField(max_length=512, blank=True, default='')
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile for {self.user}"

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
