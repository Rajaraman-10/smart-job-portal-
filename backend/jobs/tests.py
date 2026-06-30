from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Application, Job


class AuthFlowTests(TestCase):
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
