from django.conf import settings
from django.db import models
from django.utils import timezone

import random
import string

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
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField()
    category = models.CharField(max_length=100, blank=True, default='General')
    required_skills = models.CharField(max_length=500, blank=True, default='')
    company_meta = models.JSONField(blank=True, null=True, default=dict)
    posted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} at {self.company}"

class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Viewed', 'Viewed'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
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
        default='Pending',
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

class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')

    def __str__(self):
        return f"{self.user} bookmarked {self.job}"


class Interview(models.Model):
    MODE_CHOICES = [('Video', 'Video'), ('Phone', 'Phone'), ('Onsite', 'Onsite')]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='Video')
    location_or_link = models.CharField(max_length=500, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview for {self.application}"


class Message(models.Model):
    application = models.ForeignKey(Application, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} on {self.application}"
