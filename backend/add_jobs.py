#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from jobs.models import Job
from django.contrib.auth.models import User

# Get or create recruiter
recruiter, _ = User.objects.get_or_create(username='recruiter1')

# Sample jobs data
jobs_data = [
    {
        'title': 'Senior Python Developer',
        'company': 'TechCorp Solutions',
        'location': 'San Francisco, CA',
        'salary': '$120K - $160K/year',
        'description': 'We are looking for an experienced Python developer to join our backend team. You will work on scalable microservices and APIs. Requirements: 5+ years Python experience, Django/FastAPI, PostgreSQL, Docker.'
    },
    {
        'title': 'React Frontend Engineer',
        'company': 'WebDynamics Inc',
        'location': 'New York, NY',
        'salary': '$100K - $140K/year',
        'description': 'Join our frontend team and build amazing user interfaces. We use React, TypeScript, and modern CSS. Requirements: 3+ years React, TypeScript, responsive design, Git.'
    },
    {
        'title': 'Full Stack Developer',
        'company': 'StartupXYZ',
        'location': 'Remote',
        'salary': '$90K - $130K/year',
        'description': 'Help us build the next big thing! We need a full-stack developer comfortable with both frontend and backend. Tech stack: React, Node.js, MongoDB. Requirements: 3+ years experience in both frontend and backend development.'
    },
    {
        'title': 'DevOps Engineer',
        'company': 'CloudInfra Ltd',
        'location': 'Austin, TX',
        'salary': '$110K - $150K/year',
        'description': 'Manage and optimize our cloud infrastructure. Experience with AWS, Kubernetes, CI/CD pipelines. Requirements: 4+ years DevOps experience, AWS/GCP, Docker, Kubernetes, Terraform.'
    },
    {
        'title': 'Data Science Engineer',
        'company': 'DataViz Analytics',
        'location': 'Boston, MA',
        'salary': '$115K - $155K/year',
        'description': 'Build machine learning models and data pipelines. Work with Python, SQL, and Big Data technologies. Requirements: 3+ years ML/Data Science, Python, SQL, TensorFlow/PyTorch, Spark.'
    }
]

# Create jobs
for job_data in jobs_data:
    job, created = Job.objects.get_or_create(
        title=job_data['title'],
        company=job_data['company'],
        defaults={
            'recruiter': recruiter,
            'location': job_data['location'],
            'salary': job_data['salary'],
            'description': job_data['description']
        }
    )
    status = 'Created' if created else 'Already exists'
    print(f'{status}: {job.title} at {job.company}')

print(f'\nTotal jobs in database: {Job.objects.count()}')
