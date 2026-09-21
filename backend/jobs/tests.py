from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Application, Job, Company, RecruiterProfile, LoginOTP, Conversation, Interview, InterviewFeedback, Reminder, TechnicalQuiz, OfferLetter, SubscriptionPlan, PaymentTransaction


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
        self.assertEqual(response.json()['status'], 'RECRUITER_VIEWED')
        self.assertIsNotNone(response.json()['viewed_at'])

    def test_application_detail_keeps_canonical_status_codes_for_recruiters(self):
        applicant = User.objects.create_user(username='applicant-detail@example.com', email='applicant-detail@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter-detail@example.com', email='recruiter-detail@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Frontend Engineer', company='Acme', location='Remote', description='Ship UI')
        application = Application.objects.create(
            job=job,
            applicant=applicant,
            applicant_name='Applicant Detail',
            applicant_email='applicant-detail@example.com',
            status='APPLIED',
        )

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.get(f'/api/applications/{application.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'RECRUITER_VIEWED')

    def test_scheduling_interview_updates_application_and_creates_conversation(self):
        applicant = User.objects.create_user(username='applicant3@example.com', email='applicant3@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter3@example.com', email='recruiter3@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Product Designer', company='Acme', location='Remote', description='Design apps')
        application = Application.objects.create(
            job=job,
            applicant=applicant,
            applicant_name='Applicant Three',
            applicant_email='applicant3@example.com',
            status='APPLIED',
        )

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.post(
            '/api/interviews/',
            {
                'application': application.id,
                'interview_date': '2026-08-01',
                'interview_time': '10:00',
                'interview_mode': 'Video',
                'meeting_link': 'https://meet.example.com',
                'notes': 'Please be prepared',
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        application.refresh_from_db()
        self.assertEqual(application.status, 'INTERVIEW_SCHEDULED')
        self.assertTrue(Conversation.objects.filter(application=application).exists())

    def test_scheduling_interview_generates_room_details_for_jitsi(self):
        applicant = User.objects.create_user(username='applicant4@example.com', email='applicant4@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter4@example.com', email='recruiter4@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Data Scientist', company='Acme', location='Remote', description='Analyze data')
        application = Application.objects.create(
            job=job,
            applicant=applicant,
            applicant_name='Applicant Four',
            applicant_email='applicant4@example.com',
            status='APPLIED',
        )

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.post(
            '/api/interviews/',
            {
                'application': application.id,
                'interview_date': '2026-08-10',
                'interview_time': '14:30',
                'interview_mode': 'Video',
                'meeting_link': 'https://meet.example.com/room',
                'notes': 'Please join 5 minutes early',
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        interview = Interview.objects.get(pk=response.json()['id'])
        self.assertTrue(interview.room_name)
        self.assertTrue(interview.meeting_url)
        self.assertEqual(interview.candidate, applicant)
        self.assertEqual(interview.recruiter, recruiter)

    def test_message_creation_accepts_application_payload(self):
        applicant = User.objects.create_user(username='applicant5@example.com', email='applicant5@example.com', password='secret123')
        recruiter = User.objects.create_user(username='recruiter5@example.com', email='recruiter5@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Data Scientist', company='Acme', location='Remote', description='Analyze data')
        application = Application.objects.create(
            job=job,
            applicant=applicant,
            applicant_name='Applicant Four',
            applicant_email='applicant5@example.com',
            status='INTERVIEW_SCHEDULED',
        )

        client = APIClient()
        refresh = RefreshToken.for_user(recruiter)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = client.post(
            '/api/messages/',
            {'application': application.id, 'content': 'Thanks for the update'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Conversation.objects.filter(application=application).exists())
        self.assertEqual(response.json()['content'], 'Thanks for the update')

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

    def test_quiz_and_offer_workflow(self):
        applicant = User.objects.create_user(username='workflow-applicant@example.com', email='workflow-applicant@example.com', password='secret123')
        recruiter = User.objects.create_user(username='workflow-recruiter@example.com', email='workflow-recruiter@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Backend Engineer', company='Acme', location='Remote', description='Build APIs')
        application = Application.objects.create(job=job, applicant=applicant, applicant_name='Workflow Applicant', applicant_email=applicant.email, status='SHORTLISTED')
        question = {'id': 'q1', 'prompt': 'Which protocol is used for web APIs?', 'options': ['HTTP', 'FTP'], 'correct_option': 'HTTP'}

        recruiter_client = APIClient()
        recruiter_client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(recruiter).access_token}')
        publish_response = recruiter_client.put(
            f'/api/applications/{application.id}/workflow/',
            {'questions': [question]},
            content_type='application/json',
        )
        self.assertEqual(publish_response.status_code, 200)
        self.assertEqual(TechnicalQuiz.objects.get(application=application).status, 'PUBLISHED')

        applicant_client = APIClient()
        applicant_client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(applicant).access_token}')
        submit_response = applicant_client.post(
            f'/api/applications/{application.id}/workflow/',
            {'answers': {'q1': 'HTTP'}},
            content_type='application/json',
        )
        self.assertEqual(submit_response.status_code, 200)
        self.assertTrue(submit_response.json()['passed'])

        application.status = 'INTERVIEW_SCHEDULED'
        application.save(update_fields=['status'])
        offer_response = recruiter_client.put(
            f'/api/applications/{application.id}/offer/',
            {'salary': 'INR 12 LPA', 'joining_date': '2026-10-01', 'terms': 'Full-time employment'},
            content_type='application/json',
        )
        self.assertEqual(offer_response.status_code, 200)
        self.assertEqual(OfferLetter.objects.get(application=application).status, 'SENT')

        accept_response = applicant_client.post(
            f'/api/applications/{application.id}/offer/',
            {'status': 'ACCEPTED'},
            content_type='application/json',
        )
        self.assertEqual(accept_response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.status, 'JOINED')

    def test_recruiter_can_filter_rank_and_compare_candidates(self):
        applicant_one = User.objects.create_user(username='rank-one@example.com', email='rank-one@example.com', password='secret123')
        applicant_two = User.objects.create_user(username='rank-two@example.com', email='rank-two@example.com', password='secret123')
        recruiter = User.objects.create_user(username='rank-recruiter@example.com', email='rank-recruiter@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Python Engineer', company='Acme', location='Remote', description='Build APIs', work_mode='Remote')
        first = Application.objects.create(job=job, applicant=applicant_one, applicant_name='Rank One', applicant_email=applicant_one.email, skills='Python, Django', ai_match_score=92)
        second = Application.objects.create(job=job, applicant=applicant_two, applicant_name='Rank Two', applicant_email=applicant_two.email, skills='Java', ai_match_score=42)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(recruiter).access_token}')

        ranked = client.get('/api/applications/?ordering=-ai_match_score&min_score=80&skills=Python')
        self.assertEqual(ranked.status_code, 200)
        self.assertEqual([item['id'] for item in ranked.json()], [first.id])

        compared = client.get(f'/api/applications/compare/?ids={first.id},{second.id}')
        self.assertEqual(compared.status_code, 200)
        self.assertEqual([item['id'] for item in compared.json()], [first.id, second.id])

    def test_interview_feedback_and_reminders_are_created(self):
        applicant = User.objects.create_user(username='feedback-applicant@example.com', email='feedback-applicant@example.com', password='secret123')
        recruiter = User.objects.create_user(username='feedback-recruiter@example.com', email='feedback-recruiter@example.com', password='secret123', last_name='recruiter')
        job = Job.objects.create(recruiter=recruiter, title='Feedback Engineer', company='Acme', location='Remote', description='Review candidates')
        application = Application.objects.create(job=job, applicant=applicant, applicant_name='Feedback Applicant', applicant_email=applicant.email, status='APPLIED')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(recruiter).access_token}')
        interview = client.post('/api/interviews/', {'application': application.id, 'interview_date': '2026-10-01', 'interview_time': '10:00', 'interview_mode': 'Video'}, content_type='application/json').json()
        self.assertEqual(Reminder.objects.filter(interview_id=interview['id']).count(), 2)

        response = client.post(f"/api/interviews/{interview['id']}/feedback/", {'overall_rating': 5, 'recommendation': 'STRONG_YES', 'notes': 'Excellent interview.'}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(InterviewFeedback.objects.get(interview_id=interview['id']).overall_rating, 5)

    def test_subscription_transaction_is_idempotent(self):
        recruiter = User.objects.create_user(username='billing-recruiter@example.com', email='billing-recruiter@example.com', password='secret123', last_name='recruiter')
        plan = SubscriptionPlan.objects.create(name='Pro', code='pro', amount=999, features=['Advanced filters'])
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(recruiter).access_token}')
        payload = {'plan_id': plan.id, 'idempotency_key': 'billing-test-1'}
        first = client.post('/api/subscription/', payload, content_type='application/json')
        second = client.post('/api/subscription/', payload, content_type='application/json')
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(PaymentTransaction.objects.filter(idempotency_key='billing-test-1').count(), 1)
