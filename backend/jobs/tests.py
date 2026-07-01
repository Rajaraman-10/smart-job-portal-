from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Application, Job, Company, RecruiterProfile, LoginOTP


class AuthFlowTests(TestCase):
    def test_recruiters_from_same_company_share_company_jobs(self):
        company = Company.objects.create(name='Acme Corp')
        first_recruiter = User.objects.create_user(
            username='first.recruiter@example.com',
            email='first.recruiter@example.com',
            password='secret123',
            last_name='recruiter',
        )
        second_recruiter = User.objects.create_user(
            username='second.recruiter@example.com',
            email='second.recruiter@example.com',
            password='secret123',
            last_name='recruiter',
        )
        other_recruiter = User.objects.create_user(
            username='other.recruiter@example.com',
            email='other.recruiter@example.com',
            password='secret123',
            last_name='recruiter',
        )
        RecruiterProfile.objects.create(user=first_recruiter, company=company)
        RecruiterProfile.objects.create(user=second_recruiter, company=company)
        RecruiterProfile.objects.create(user=other_recruiter, company=Company.objects.create(name='Other Inc'))

        Job.objects.create(recruiter=first_recruiter, title='Lead Engineer', company='Acme Corp', location='Remote', description='Build software')
        Job.objects.create(recruiter=other_recruiter, title='Designer', company='Other Inc', location='Remote', description='Design things')

        client = APIClient()
        refresh = RefreshToken.for_user(second_recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.get('/api/jobs/')

        self.assertEqual(response.status_code, 200)
        job_ids = [job['id'] for job in response.json()]
        self.assertIn(1, job_ids)
        self.assertNotIn(2, job_ids)

    def test_login_accepts_case_insensitive_email(self):
        register_response = self.client.post(
            '/api/auth/register/',
            {
                'name': 'Test User',
                'email': 'User@Example.COM',
                'password': 'secret123',
                'user_type': 'jobseeker',
            },
            content_type='application/json',
        )

        self.assertEqual(register_response.status_code, 201)

        login_response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'user@example.com',
                'password': 'secret123',
            },
            content_type='application/json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.json())

    def test_duplicate_email_registration_is_rejected(self):
        first_response = self.client.post(
            '/api/auth/register/',
            {
                'name': 'First User',
                'email': 'duplicate@example.com',
                'password': 'secret123',
                'user_type': 'jobseeker',
            },
            content_type='application/json',
        )
        self.assertEqual(first_response.status_code, 201)

        second_response = self.client.post(
            '/api/auth/register/',
            {
                'name': 'Second User',
                'email': 'duplicate@example.com',
                'password': 'secret123',
                'user_type': 'recruiter',
            },
            content_type='application/json',
        )

        self.assertEqual(second_response.status_code, 400)
        self.assertIn('already registered', str(second_response.json()).lower())

    def test_recruiter_registration_creates_company_and_profile(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'name': 'Recruiter Person',
                'email': 'recruiter-registration@example.com',
                'password': 'secret123',
                'user_type': 'recruiter',
                'company_name': 'Acme Labs',
                'company_location': 'Remote',
                'company_size': '50-200',
                'company_description': 'We build labs',
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email='recruiter-registration@example.com')
        company = Company.objects.get(name='Acme Labs')
        profile = RecruiterProfile.objects.get(user=user)
        self.assertEqual(profile.company, company)
        self.assertEqual(company.location, 'Remote')

    def test_recruiter_view_marks_application_as_viewed(self):
        applicant = User.objects.create_user(username='applicant@example.com', email='applicant@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter@example.com', email='recruiter@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Developer', company='Acme', location='Remote', description='Build things')
        application = Application.objects.create(job=job, applicant=applicant, applicant_name='Applicant', applicant_email='applicant@example.com', status='Pending')

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = client.get(f'/api/applications/{application.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'Viewed')
        self.assertIsNotNone(response.json()['viewed_at'])

    def test_request_otp_sends_email_and_creates_code(self):
        response = self.client.post(
            '/api/auth/request-otp/',
            {'email': 'candidate@example.com'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(LoginOTP.objects.filter(email='candidate@example.com').exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('OTP', mail.outbox[0].subject)

    def test_request_otp_handles_email_delivery_failures(self):
        with patch('jobs.views.send_mail', side_effect=Exception('SMTP failed')):
            response = self.client.post(
                '/api/auth/request-otp/',
                {'email': 'fallback@example.com'},
                content_type='application/json',
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(LoginOTP.objects.filter(email='fallback@example.com').exists())

    def test_verify_otp_returns_tokens_for_existing_user(self):
        otp = LoginOTP.objects.create(email='verified@example.com', code='123456')

        response = self.client.post(
            '/api/auth/verify-otp/',
            {'email': 'verified@example.com', 'otp': otp.code},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())
        self.assertTrue(User.objects.filter(email='verified@example.com').exists())

    def test_recruiter_status_change_sends_email(self):
        applicant = User.objects.create_user(username='applicant2@example.com', email='applicant2@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter2@example.com', email='recruiter2@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Data Analyst', company='Acme', location='Remote', description='Analyze data')
        application = Application.objects.create(
            job=job,
            applicant=applicant,
            applicant_name='Applicant Two',
            applicant_email='applicant2@example.com',
            status='Pending',
        )

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.patch(
            f'/api/applications/{application.id}/',
            {'status': 'Approved'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Your application status', mail.outbox[0].subject)
