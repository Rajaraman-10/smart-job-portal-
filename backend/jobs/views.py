import csv
import uuid
from datetime import datetime, timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import Conversation, Job, Application, Message, Company, RecruiterProfile, UserProfile, Bookmark, Interview, InterviewFeedback, Notification, LoginOTP, Resume, AdminAuditLog, TechnicalQuiz, OfferLetter, Reminder, SubscriptionPlan, Subscription, PaymentTransaction
from .resume_scanner import scan_application
from .status_utils import normalize_application_status, to_display_application_status
import re
import secrets
try:
    import pdfplumber
except ImportError:
    pdfplumber = None
from PyPDF2 import PdfReader
from .serializers import (
    ConversationSerializer,
    JobSerializer,
    ApplicationSerializer,
    MessageSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    BookmarkSerializer,
    InterviewSerializer,
    NotificationSerializer,
    CompanySerializer,
    ResumeSerializer,
    RecruiterProfileSerializer,
    AdminAuditLogSerializer,
    TechnicalQuizSerializer,
    OfferLetterSerializer,
    InterviewFeedbackSerializer,
    ReminderSerializer,
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    PaymentTransactionSerializer,
)


FREE_RESUME_EDIT_LIMIT = 4
AI_AUTO_REJECT_THRESHOLD = 49


def get_user_role(user):
    return user.last_name if user.last_name in ['jobseeker', 'recruiter', 'admin'] else 'jobseeker'


def is_admin(user):
    return get_user_role(user) == 'admin'


def log_admin_action(admin_user, action, target_type, target_id, target_label='', details=''):
    try:
        AdminAuditLog.objects.create(
            admin=admin_user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_label=target_label,
            details=details,
        )
    except Exception:
        pass


def get_recruiter_company_name(user):
    profile = getattr(user, 'recruiter_profile', None)
    return profile.company.name if profile and profile.company else None


def recruiter_can_access_application(user, application):
    if is_admin(user):
        return True
    if get_user_role(user) != 'recruiter':
        return False
    company_name = get_recruiter_company_name(user)
    return (
        application.job.recruiter == user
        or (company_name and application.job.company.lower() == company_name.lower())
    )


def recruiter_application_queryset(user):
    if is_admin(user):
        return Application.objects.all()
    company_name = get_recruiter_company_name(user)
    if company_name:
        return Application.objects.filter(job__company__iexact=company_name)
    return Application.objects.filter(job__recruiter=user)


def interview_datetime(interview):
    if not interview.interview_date or not interview.interview_time:
        return None
    value = datetime.combine(interview.interview_date, interview.interview_time)
    return timezone.make_aware(value, timezone.get_current_timezone())


def schedule_interview_reminders(interview):
    starts_at = interview_datetime(interview)
    if not starts_at:
        return
    for reminder_type, offset in [('INTERVIEW_24H', timedelta(hours=24)), ('INTERVIEW_1H', timedelta(hours=1))]:
        scheduled_for = starts_at - offset
        Reminder.objects.update_or_create(
            interview=interview,
            recipient=interview.candidate,
            reminder_type=reminder_type,
            defaults={
                'application': interview.application,
                'scheduled_for': scheduled_for,
                'status': 'PENDING',
                'sent_at': None,
                'last_error': '',
            },
        )


def process_due_reminders(limit=100):
    now = timezone.now()
    processed = 0
    reminders = Reminder.objects.filter(status='PENDING', scheduled_for__lte=now).select_related('recipient', 'application', 'interview')[:limit]
    for reminder in reminders:
        try:
            interview = reminder.interview
            send_mail(
                subject=f"Reminder: interview for {reminder.application.job.title}",
                message=(
                    f"Your interview for {reminder.application.job.title} at {reminder.application.job.company} "
                    f"is scheduled for {interview.interview_date} at {interview.interview_time}.\n"
                    f"Join: {interview.meeting_url or interview.meeting_link or 'See your portal for details.'}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[reminder.recipient.email],
                fail_silently=False,
            )
            Notification.objects.create(
                user=reminder.recipient,
                title='Interview reminder',
                message=f"Your interview for {reminder.application.job.title} is coming up.",
                link=f"/interview/{interview.room_name}" if interview.room_name else '',
            )
            reminder.status = 'SENT'
            reminder.sent_at = now
            reminder.last_error = ''
            reminder.save(update_fields=['status', 'sent_at', 'last_error'])
        except Exception as error:
            reminder.status = 'FAILED'
            reminder.last_error = str(error)
            reminder.save(update_fields=['status', 'last_error'])
        processed += 1
    return processed


def parse_quiz_pdf(file_obj):
    text_parts = []
    if pdfplumber:
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or '')
    else:
        file_obj.seek(0)
        text_parts = [page.extract_text() or '' for page in PdfReader(file_obj).pages]
    text = '\n'.join(text_parts)
    blocks = re.split(r'(?im)(?=^(?:q(?:uestion)?\s*)?\d+[.)]\s+)', text)
    questions = []
    for index, block in enumerate(blocks):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        prompt = re.sub(r'^(?:q(?:uestion)?\s*)?\d+[.)]\s*', '', lines[0], flags=re.I).strip()
        options = []
        correct = ''
        for line in lines[1:]:
            answer_match = re.match(r'(?i)^(?:correct\s*(?:answer|option)?|answer)\s*[:\-]\s*(.+)$', line)
            option_match = re.match(r'(?i)^([A-D])[.)]\s*(.+)$', line)
            if answer_match:
                correct = answer_match.group(1).strip()
            elif option_match:
                options.append(option_match.group(2).strip())
        if prompt and len(options) >= 2:
            if correct.upper() in 'ABCD' and len(correct) == 1:
                correct = options[ord(correct.upper()) - ord('A')] if ord(correct.upper()) - ord('A') < len(options) else ''
            questions.append({
                'id': f'question-{index + 1}',
                'prompt': prompt,
                'options': options[:4],
                'correct_option': correct,
            })
    return questions


def ensure_quiz_attempt(application):
    job = application.job
    if job.quiz_questions_status != 'PUBLISHED' or not job.quiz_questions:
        return None
    quiz, created = TechnicalQuiz.objects.get_or_create(
        application=application,
        defaults={
            'recruiter': job.recruiter,
            'questions': job.quiz_questions,
            'passing_score': 70,
            'status': TechnicalQuiz.STATUS_PUBLISHED,
            'access_token': secrets.token_urlsafe(48),
        },
    )
    if not quiz.access_token:
        quiz.access_token = secrets.token_urlsafe(48)
        quiz.save(update_fields=['access_token', 'updated_at'])
    if created or not quiz.email_sent_at:
        send_quiz_email(quiz)
    return quiz


def send_quiz_email(quiz):
    application = quiz.application
    recipient = application.applicant_email or application.applicant.email
    if not recipient:
        return False


def send_quiz_result_email(quiz, correct, wrong, score, passed):
    application = quiz.application
    recipient = application.applicant_email or application.applicant.email
    if not recipient:
        return False
    try:
        send_mail(
            subject=f"Quiz result: {application.job.title} - {score}%",
            message=(
                f"Hi {application.applicant_name or application.applicant.username},\n\n"
                f"Your technical quiz for {application.job.title} has been evaluated.\n\n"
                f"Score: {score}%\n"
                f"Correct answers: {correct}\n"
                f"Wrong answers: {wrong}\n"
                f"Result: {'PASSED' if passed else 'NOT CLEARED'}\n\n"
                f"{'You will receive the technical interview details shortly.' if passed else 'You were not shortlisted for the next round.'}\n\n"
                f"Regards,\nVipseekers Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        return True
    except Exception:
        return False
    link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/quiz/{quiz.access_token}"
    try:
        send_mail(
            subject=f"Technical quiz invitation: {application.job.title}",
            message=(
                f"Hi {application.applicant_name or application.applicant.username},\n\n"
                f"Your resume was shortlisted for {application.job.title}.\n"
                f"Quiz window: {application.job.quiz_starts_at or 'Now'} to {application.job.quiz_ends_at or 'the closing time'}\n"
                f"Duration: {application.job.quiz_duration_minutes} minutes\n"
                f"Instructions: {application.job.quiz_instructions or 'Complete the quiz independently during the scheduled window.'}\n"
                f"Start quiz: {link}\n\nRegards,\nVipseekers Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        quiz.email_sent_at = timezone.now()
        quiz.email_send_error = ''
        quiz.save(update_fields=['email_sent_at', 'email_send_error', 'updated_at'])
        return True
    except Exception as error:
        quiz.email_send_error = str(error)
        quiz.save(update_fields=['email_send_error', 'updated_at'])
        return False


def get_tokens_for_user(user, user_type='jobseeker'):
    UserProfile.objects.get_or_create(user=user)
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user_type': user_type,
        'user': UserSerializer(user).data,
    }


class IsRecruiterOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Custom permission to allow only the recruiter who posted a job to edit/delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        if isinstance(obj, Job):
            return obj.recruiter == request.user
        return False


class IsAdminOrRecruiterJobAccess(IsAuthenticatedOrReadOnly):
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        user = request.user
        if is_admin(user):
            return True
        if isinstance(obj, Job):
            return obj.recruiter == user
        return False


class IsAdminOrRecruiterApplicationAccess(IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        user = request.user
        user_type = get_user_role(user)
        if user_type == 'admin':
            return True
        if user_type == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if obj.job.recruiter == user:
                return True
            if company_name and obj.job.company.lower() == company_name.lower():
                return True
            return False
        if user_type == 'jobseeker':
            return obj.applicant == user
        return False


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-posted_at')
    serializer_class = JobSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminOrRecruiterJobAccess]

    def get_queryset(self):
        category = self.request.query_params.get('category')
        queryset = Job.objects.all().order_by('-posted_at')
        user = self.request.user

        if not user.is_authenticated or get_user_role(user) not in ('recruiter', 'admin'):
            queryset = queryset.filter(status=Job.STATUS_ACTIVE)

        if category and category != 'All Jobs':
            queryset = queryset.filter(category__iexact=category)

        if not user.is_authenticated:
            return queryset

        if get_user_role(user) == 'admin':
            return queryset

        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                return queryset.filter(company__iexact=company_name)
            return queryset.filter(recruiter=user)

        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            user = self.request.user
            company_name = serializer.validated_data.get('company') or get_recruiter_company_name(user)
            serializer.save(recruiter=user, company=company_name or user.username)
        else:
            raise PermissionDenied('Authentication required to post jobs')

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        acting_as_moderator = is_admin(user) and instance.recruiter_id != user.id
        old_status = instance.status
        updated = serializer.save()
        if acting_as_moderator and updated.status != old_status:
            log_admin_action(
                user,
                'JOB_STATUS_CHANGED',
                'job',
                updated.id,
                target_label=updated.title,
                details=f"{old_status} -> {updated.status}",
            )

    def perform_destroy(self, instance):
        user = self.request.user
        if is_admin(user) and instance.recruiter_id != user.id:
            log_admin_action(
                user,
                'JOB_DELETED',
                'job',
                instance.id,
                target_label=instance.title,
                details=f"Company: {instance.company}",
            )
        instance.delete()

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAdminOrRecruiterApplicationAccess]
    authentication_classes = [JWTAuthentication]
    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def get_queryset(self):
        """
        Filter applications based on user role:
        - Recruiters: See applications for jobs they posted
        - Job Seekers: See their own applications
        """
        user = self.request.user
        user_type = get_user_role(user)
        
        queryset = (
            recruiter_application_queryset(user)
            if user_type in {'recruiter', 'admin'}
            else Application.objects.filter(applicant=user)
        )

        if user_type in {'recruiter', 'admin'}:
            params = self.request.query_params
            search = params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(applicant_name__icontains=search)
                    | Q(applicant_email__icontains=search)
                    | Q(applicant__first_name__icontains=search)
                    | Q(applicant__last_name__icontains=search)
                    | Q(job__title__icontains=search)
                    | Q(job__company__icontains=search)
                )
            if params.get('job'):
                queryset = queryset.filter(job_id=params['job'])
            if params.get('status'):
                queryset = queryset.filter(status__in=[value.strip().upper() for value in params['status'].split(',') if value.strip()])
            if params.get('min_score'):
                queryset = queryset.filter(ai_match_score__gte=params['min_score'])
            if params.get('max_score'):
                queryset = queryset.filter(ai_match_score__lte=params['max_score'])
            if params.get('skills'):
                for skill in params['skills'].split(','):
                    if skill.strip():
                        queryset = queryset.filter(Q(skills__icontains=skill.strip()) | Q(ai_matched_skills__icontains=skill.strip()))
            if params.get('experience_level'):
                queryset = queryset.filter(job__experience_level__iexact=params['experience_level'])
            if params.get('work_mode'):
                queryset = queryset.filter(job__work_mode__iexact=params['work_mode'])
            if params.get('applied_after'):
                queryset = queryset.filter(applied_at__date__gte=params['applied_after'])
            if params.get('applied_before'):
                queryset = queryset.filter(applied_at__date__lte=params['applied_before'])
            if params.get('has_interview') == 'true':
                queryset = queryset.filter(interviews__isnull=False)
            elif params.get('has_interview') == 'false':
                queryset = queryset.filter(interviews__isnull=True)

        ordering = self.request.query_params.get('ordering', '-applied_at')
        allowed_orderings = {'applied_at', '-applied_at', 'ai_match_score', '-ai_match_score', 'applicant_name', '-applicant_name'}
        if ordering not in allowed_orderings:
            ordering = '-applied_at'
        return queryset.distinct().order_by(ordering)

    def perform_create(self, serializer):
        applicant_user = self.request.user
        applicant_name = serializer.validated_data.get('applicant_name') or applicant_user.first_name or applicant_user.username
        applicant_email = serializer.validated_data.get('applicant_email') or applicant_user.email

        save_kwargs = {
            'applicant': applicant_user,
            'applicant_name': applicant_name,
            'applicant_email': applicant_email,
        }

        resume_id = self.request.data.get('resume_id')
        if resume_id and not serializer.validated_data.get('resume_file'):
            saved_resume = Resume.objects.filter(id=resume_id, user=applicant_user).first()
            if saved_resume:
                save_kwargs['resume_file'] = saved_resume.file

        application = serializer.save(**save_kwargs)

        try:
            scan_result = scan_application(application)
            application.ai_match_score = scan_result['ai_match_score']
            application.ai_matched_skills = scan_result['ai_matched_skills']
            application.ai_missing_skills = scan_result['ai_missing_skills']
            application.ai_scanned_at = timezone.now()
            update_fields = ['ai_match_score', 'ai_matched_skills', 'ai_missing_skills', 'ai_scanned_at']

            threshold = application.job.screening_threshold or AI_AUTO_REJECT_THRESHOLD
            if application.ai_match_score is not None and application.ai_match_score < threshold:
                application.status = 'RESUME_REJECTED'
                update_fields.append('status')
            elif application.ai_match_score is not None and application.ai_match_score >= threshold and application.status == 'APPLIED':
                application.status = 'RESUME_SHORTLISTED'
                update_fields.append('status')

            application.save(update_fields=update_fields)

            if application.status == 'RESUME_REJECTED':
                recipient = application.applicant_email or applicant_user.email
                if recipient:
                    send_mail(
                        subject=f"Your application status: Rejected",
                        message=(
                            f"Hi {application.applicant_name or applicant_user.first_name or applicant_user.username},\n\n"

f"Thank you for taking the time to apply for the '{application.job.title}' position at Vipseekers.\n\n"

f"We appreciate your interest in this opportunity and the effort you put into your application. "
f"After completing our initial automated screening process, your application did not meet the "
f"current matching criteria for this particular role.\n\n"

                            f"Your profile received an AI match score of {application.ai_match_score}%, while the current "
                            f"screening threshold for this position is {threshold}%.\n\n"

f"Please note that this is an initial automated screening based primarily on the skills, experience, "
f"and keywords listed in your application compared with the requirements of the role. "
f"It may not fully represent your overall qualifications, experience, or potential.\n\n"

f"We encourage you to explore and apply for other opportunities on Vipseekers that may be "
f"better aligned with your skills and experience.\n\n"

f"Thank you again for your interest in Vipseekers. We wish you the very best in your job search "
f"and future career opportunities.\n\n"

f"Regards,\n"
f"Vipseekers Team"
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[recipient],
                        fail_silently=True,
                    )
                Notification.objects.create(
                    user=applicant_user,
                    title="Application status updated",
                    message=f"Your application for {application.job.title} was auto-rejected by AI screening "
                            f"(match score {application.ai_match_score}%, below the {threshold}% threshold).",
                )
            elif application.status == 'RESUME_SHORTLISTED':
                recipient = application.applicant_email or applicant_user.email
                send_mail(
                    subject=f"Resume shortlisted for {application.job.title}",
                    message=(
                        f"Hi {application.applicant_name or applicant_user.username},\n\n"
                        f"Your resume has been shortlisted for the quiz round for {application.job.title}.\n"
                        f"Quiz date/time: {application.job.quiz_starts_at or 'To be announced'}\n"
                        f"Duration: {application.job.quiz_duration_minutes} minutes\n"
                        f"Instructions: {application.job.quiz_instructions or 'Complete the quiz during the scheduled window.'}\n\n"
                        f"Regards,\nVipseekers Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=True,
                )
                Notification.objects.create(
                    user=applicant_user,
                    title='Resume shortlisted',
                    message=f'Your resume was shortlisted for the quiz round for {application.job.title}.',
                )
        except Exception:
            pass

        try:
            recruiter = application.job.recruiter
            recruiter_email = recruiter.email
            if recruiter_email:
                subject = f"New application for {application.job.title}"
                message = (
                    f"Hello {recruiter.first_name or recruiter.username},\n\n"
                    f"A new candidate has applied for your job posting:\n"
                    f"Job title: {application.job.title}\n"
                    f"Applicant: {application.applicant_name}\n"
                    f"Email: {application.applicant_email}\n"
                    f"Cover letter: {application.cover_letter or 'Not provided'}\n\n"
                    f"View the application in your dashboard to take next steps.\n\n"
                    "-- Smart Job Portal"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [recruiter_email],
                    fail_silently=True,
                )
        except Exception:
            pass

        return application

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        if isinstance(data, dict):
            incoming_status = data.get('status')
            normalized_status = normalize_application_status(incoming_status)
            if normalized_status != incoming_status:
                data['status'] = normalized_status

        user = request.user
        is_own_application = get_user_role(user) == 'jobseeker' and instance.applicant == user
        new_resume_file = request.FILES.get('resume_file')
        new_resume_text = data.get('resume') if isinstance(data, dict) else None
        is_resume_change = is_own_application and (
            bool(new_resume_file)
            or (new_resume_text is not None and new_resume_text.strip() and new_resume_text.strip() != (instance.resume or '').strip())
        )

        if is_resume_change:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if instance.resume_edit_count >= FREE_RESUME_EDIT_LIMIT and not profile.is_subscribed:
                return Response(
                    {
                        'detail': f'You have used all {FREE_RESUME_EDIT_LIMIT} free resume edits for this application. Upgrade to continue editing.',
                        'code': 'RESUME_EDIT_LIMIT_REACHED',
                        'resume_edit_count': instance.resume_edit_count,
                        'free_limit': FREE_RESUME_EDIT_LIMIT,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if is_resume_change:
            instance.resume_edit_count += 1
            resume_change_fields = ['resume_edit_count', 'ai_match_score', 'ai_matched_skills', 'ai_missing_skills', 'ai_scanned_at']
            try:
                scan_result = scan_application(instance)
                instance.ai_match_score = scan_result['ai_match_score']
                instance.ai_matched_skills = scan_result['ai_matched_skills']
                instance.ai_missing_skills = scan_result['ai_missing_skills']
                instance.ai_scanned_at = timezone.now()

                # Only auto-reject on a re-scan if no one has acted on this application yet —
                # never override a recruiter's own shortlist/interview/offer decision.
                if (
                    normalize_application_status(old_status) == 'APPLIED'
                    and instance.ai_match_score is not None
                    and instance.ai_match_score < AI_AUTO_REJECT_THRESHOLD
                ):
                    instance.status = 'REJECTED'
                    resume_change_fields.append('status')
            except Exception:
                pass
            instance.save(update_fields=resume_change_fields)

        new_status = serializer.validated_data.get('status', instance.status)
        display_status = to_display_application_status(new_status)
        if old_status != new_status:
            quiz = None
            if new_status in {'SHORTLISTED', 'RESUME_SHORTLISTED', 'QUIZ_SCHEDULED'}:
                quiz = ensure_quiz_attempt(instance)
            recipient = instance.applicant_email or instance.applicant.email
            if recipient:
                subject = f"Your application status: {display_status}"
                message = (
                    f"Hi {instance.applicant_name or instance.applicant.first_name or instance.applicant.username},\n\n"
                    f"Your application for '{instance.job.title}' has moved to '{display_status}'.\n\n"
                )
                if quiz:
                    quiz_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/quiz/{quiz.access_token}"
                    message += (
                        f"Your technical quiz is scheduled from {instance.job.quiz_starts_at or 'the scheduled start time'} "
                        f"to {instance.job.quiz_ends_at or 'the scheduled end time'}.\n"
                        f"Instructions: {instance.job.quiz_instructions or 'Complete the quiz during the scheduled window.'}\n"
                        f"Start Quiz: {quiz_link}\n\n"
                    )
                else:
                    message += (
                        "The quiz link is not available yet because the recruiter has not published the question set. "
                        "You will receive another email when it is ready.\n\n"
                    )
                message += "Regards,\nVipseekers Team"
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=True,
                )

            Notification.objects.create(
                user=instance.applicant,
                title=f"Application status updated",
                message=(
                    f"Your application for {instance.job.title} is now {display_status}. "
                    f"{'Open the quiz link in your email to attend.' if quiz else 'The quiz link will be sent after the question set is published.'}"
                ),
                link=(f"/quiz/{quiz.access_token}" if quiz else f"/applications/{instance.id}"),
            )

        response_data = serializer.data
        response_data['status'] = normalize_application_status(response_data.get('status'))
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        user_type = get_user_role(user)
        company_name = get_recruiter_company_name(user)
        has_company_access = False
        if user_type == 'recruiter':
            has_company_access = company_name and instance.job.company.lower() == company_name.lower()

        normalized_status = normalize_application_status(instance.status)
        if user_type == 'recruiter' and (instance.job.recruiter == user or has_company_access) and normalized_status == 'APPLIED':
            instance.status = 'RECRUITER_VIEWED'
            instance.viewed_at = timezone.now()
            instance.save(update_fields=['status', 'viewed_at'])

        conversation = getattr(instance, 'conversation', None)
        if conversation and conversation.messages.filter(is_read=False).exclude(sender=request.user).exists():
            conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        serializer = self.get_serializer(instance)
        response_data = serializer.data
        response_data['status'] = normalize_application_status(response_data.get('status'))
        if conversation:
            response_data['unread_message_count'] = conversation.messages.filter(is_read=False).exclude(sender=request.user).count()
        else:
            response_data['unread_message_count'] = 0
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='grouped-by-job')
    def grouped_by_job(self, request):
        """Return recruiter applications grouped by posted job."""
        user = request.user
        user_type = get_user_role(user)
        
        if user_type != 'recruiter':
            return Response({'detail': 'Only recruiters can view grouped job applications.'}, status=status.HTTP_403_FORBIDDEN)

        company_name = get_recruiter_company_name(user)
        jobs = Job.objects.filter(company__iexact=company_name).order_by('-posted_at') if company_name else Job.objects.filter(recruiter=user).order_by('-posted_at')
        grouped = []
        for job in jobs:
            applications = Application.objects.filter(job=job).order_by('-applied_at')
            grouped.append({
                'job': JobSerializer(job).data,
                'applications': ApplicationSerializer(applications, many=True, context={'request': request}).data,
            })
        return Response(grouped)


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        user_type = get_user_role(user)
        if user_type not in ['recruiter', 'admin']:
            return Response({'detail': 'Analytics available to recruiters and admins only.'}, status=status.HTTP_403_FORBIDDEN)

        if user_type == 'admin':
            jobs = Job.objects.all()
            applications = Application.objects.all()
            interviews = Interview.objects.all()
        else:
            company_name = get_recruiter_company_name(user)
            if company_name:
                jobs = Job.objects.filter(company__iexact=company_name)
                applications = Application.objects.filter(job__company__iexact=company_name)
                interviews = Interview.objects.filter(application__job__company__iexact=company_name)
            else:
                jobs = Job.objects.filter(recruiter=user)
                applications = Application.objects.filter(job__recruiter=user)
                interviews = Interview.objects.filter(recruiter=user)

        applications_per_day = []
        date_counts = {}
        for application in applications.order_by('-applied_at'):
            if application.applied_at:
                date_str = application.applied_at.strftime('%Y-%m-%d')
                date_counts[date_str] = date_counts.get(date_str, 0) + 1
        applications_per_day = [{'day': day, 'applications': count} for day, count in sorted(date_counts.items())]

        job_counts = {}
        for application in applications:
            job_title = application.job.title if application.job else 'Unknown'
            job_counts[job_title] = job_counts.get(job_title, 0) + 1
        top_jobs = [{'title': title, 'company': Application.objects.filter(job__title=title).first().job.company if Application.objects.filter(job__title=title).exists() else '', 'applications': count} for title, count in sorted(job_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

        skill_counts = {}
        for application in applications:
            skills = (application.skills or '').split(',')
            for skill in skills:
                normalized = skill.strip().title()
                if normalized:
                    skill_counts[normalized] = skill_counts.get(normalized, 0) + 1
        top_skills = [{'name': name, 'count': count} for name, count in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

        total_applications = applications.count()
        job_share = []
        job_share_map = {}
        for application in applications:
            company = application.job.company if application.job else 'Unknown'
            job_share_map[company] = job_share_map.get(company, 0) + 1
        job_share = [{'name': company, 'value': count} for company, count in sorted(job_share_map.items(), key=lambda item: item[1], reverse=True)[:5]]

        return Response({
            'jobs_posted': jobs.count(),
            'applications': total_applications,
            'interviews': interviews.count(),
            'applications_per_day': applications_per_day,
            'top_jobs': top_jobs,
            'top_skills': top_skills,
            'job_share': job_share,
        })


class AnalyticsExportView(AnalyticsView):
    def get(self, request):
        if get_user_role(request.user) not in {'recruiter', 'admin'}:
            return Response({'detail': 'Reports are available to recruiters and admins only.'}, status=status.HTTP_403_FORBIDDEN)
        applications = recruiter_application_queryset(request.user).select_related('job', 'applicant')
        if request.query_params.get('job'):
            applications = applications.filter(job_id=request.query_params['job'])
        if request.query_params.get('applied_after'):
            applications = applications.filter(applied_at__date__gte=request.query_params['applied_after'])
        if request.query_params.get('applied_before'):
            applications = applications.filter(applied_at__date__lte=request.query_params['applied_before'])
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="smart-job-applications.csv"'
        writer = csv.writer(response)
        writer.writerow(['Application ID', 'Candidate', 'Email', 'Job', 'Company', 'Status', 'Match Score', 'Applied At'])
        for application in applications.order_by('-applied_at'):
            writer.writerow([
                application.id,
                application.applicant_name or application.applicant.get_full_name(),
                application.applicant_email or application.applicant.email,
                application.job.title,
                application.job.company,
                normalize_application_status(application.status),
                application.ai_match_score if application.ai_match_score is not None else '',
                application.applied_at.isoformat() if application.applied_at else '',
            ])
        return response


class CandidateCompareView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        if get_user_role(request.user) not in {'recruiter', 'admin'}:
            return Response({'detail': 'Only recruiters and admins can compare candidates.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            ids = [int(value) for value in request.query_params.get('ids', '').split(',') if value.strip()]
        except ValueError:
            return Response({'detail': 'ids must be comma-separated application IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        if not ids or len(ids) > 6:
            return Response({'detail': 'Provide between 1 and 6 application IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        applications = recruiter_application_queryset(request.user).filter(id__in=ids).select_related('job', 'applicant')
        if applications.count() != len(set(ids)):
            return Response({'detail': 'One or more applications are outside your access scope.'}, status=status.HTTP_403_FORBIDDEN)
        by_id = {application.id: application for application in applications}
        ordered = [by_id[application_id] for application_id in ids]
        return Response(ApplicationSerializer(ordered, many=True, context={'request': request}).data)


class RecommendedJobsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        profile = UserProfile.objects.filter(user=request.user).first()
        profile_skills = {str(skill).strip().lower() for skill in ((profile.skills if profile else []) or []) if str(skill).strip()}
        applied_job_ids = Application.objects.filter(applicant=request.user).values_list('job_id', flat=True)
        recommendations = []
        for job in Job.objects.filter(status=Job.STATUS_ACTIVE).exclude(id__in=applied_job_ids).order_by('-posted_at')[:100]:
            required_skills = {skill.strip().lower() for skill in (job.required_skills or '').split(',') if skill.strip()}
            skill_score = (len(profile_skills & required_skills) / len(required_skills) * 70) if required_skills else 0
            preference_score = 0
            if profile and profile.preferred_work_mode and profile.preferred_work_mode.lower() == job.work_mode.lower():
                preference_score += 15
            if profile and profile.preferred_job_type and profile.preferred_job_type.lower() == 'full-time':
                preference_score += 5
            score = round(min(100, skill_score + preference_score), 2)
            recommendations.append({**JobSerializer(job, context={'request': request}).data, 'recommendation_score': score})
        recommendations.sort(key=lambda job: (job['recommendation_score'], job.get('posted_at') or ''), reverse=True)
        return Response(recommendations[:20])


class InterviewFeedbackView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_interview(self, request, interview_id):
        interview = get_object_or_404(Interview.objects.select_related('application__job'), id=interview_id)
        if get_user_role(request.user) == 'admin' or (get_user_role(request.user) == 'recruiter' and recruiter_can_access_application(request.user, interview.application)):
            return interview
        raise PermissionDenied('You cannot access feedback for this interview.')

    def get(self, request, interview_id):
        interview = self.get_interview(request, interview_id)
        feedback = interview.feedback.all() if get_user_role(request.user) == 'admin' else interview.feedback.filter(reviewer=request.user)
        return Response(InterviewFeedbackSerializer(feedback, many=True).data)

    def post(self, request, interview_id):
        interview = self.get_interview(request, interview_id)
        if get_user_role(request.user) not in {'recruiter', 'admin'}:
            raise PermissionDenied('Only interviewers can submit feedback.')
        feedback = InterviewFeedback.objects.filter(interview=interview, reviewer=request.user).first()
        serializer = InterviewFeedbackSerializer(feedback, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(interview=interview, reviewer=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReminderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        if get_user_role(self.request.user) == 'admin':
            return Reminder.objects.all()
        if get_user_role(self.request.user) == 'recruiter':
            return Reminder.objects.filter(application__in=recruiter_application_queryset(self.request.user))
        return Reminder.objects.filter(recipient=self.request.user)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('amount')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        subscription = Subscription.objects.select_related('plan').filter(user=request.user).first()
        return Response(SubscriptionSerializer(subscription).data if subscription else None)

    def post(self, request):
        plan = get_object_or_404(SubscriptionPlan, id=request.data.get('plan_id'), is_active=True)
        idempotency_key = request.data.get('idempotency_key') or uuid.uuid4().hex
        transaction, created = PaymentTransaction.objects.get_or_create(
            idempotency_key=idempotency_key,
            defaults={
                'user': request.user,
                'plan': plan,
                'amount': plan.amount,
                'currency': plan.currency,
                'provider': request.data.get('provider', 'manual'),
                'status': 'CREATED',
            },
        )
        if transaction.user_id != request.user.id:
            return Response({'detail': 'Invalid idempotency key.'}, status=status.HTTP_409_CONFLICT)
        return Response({
            'transaction': PaymentTransactionSerializer(transaction).data,
            'checkout_required': True,
            'message': 'Connect a payment provider and confirm this transaction through the webhook endpoint.',
            'created': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PaymentWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        transaction = PaymentTransaction.objects.filter(
            Q(idempotency_key=request.data.get('idempotency_key')) | Q(provider_payment_id=request.data.get('provider_payment_id'))
        ).first()
        if not transaction:
            return Response({'detail': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = str(request.data.get('status', '')).upper()
        if new_status not in {'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'}:
            return Response({'detail': 'Unsupported payment status.'}, status=status.HTTP_400_BAD_REQUEST)
        transaction.status = new_status
        transaction.provider_payment_id = request.data.get('provider_payment_id', transaction.provider_payment_id)
        transaction.metadata = request.data.get('metadata', transaction.metadata)
        transaction.save(update_fields=['status', 'provider_payment_id', 'metadata', 'updated_at'])
        if new_status == 'SUCCEEDED':
            now = timezone.now()
            subscription, _ = Subscription.objects.update_or_create(
                user=transaction.user,
                defaults={
                    'plan': transaction.plan,
                    'status': 'ACTIVE',
                    'provider': transaction.provider,
                    'provider_subscription_id': request.data.get('provider_subscription_id', ''),
                    'current_period_start': now,
                    'current_period_end': now + timedelta(days=30),
                },
            )
            UserProfile.objects.update_or_create(user=transaction.user, defaults={'is_subscribed': True})
            return Response(SubscriptionSerializer(subscription).data)
        return Response(PaymentTransactionSerializer(transaction).data)


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


MAX_RESUMES_PER_USER = 5


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        if Resume.objects.filter(user=self.request.user).count() >= MAX_RESUMES_PER_USER:
            raise PermissionDenied(f'You can keep at most {MAX_RESUMES_PER_USER} resumes. Delete one before uploading another.')
        is_first = not Resume.objects.filter(user=self.request.user).exists()
        serializer.save(user=self.request.user, is_primary=is_first)

    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        resume = self.get_object()
        Resume.objects.filter(user=request.user).exclude(id=resume.id).update(is_primary=False)
        resume.is_primary = True
        resume.save(update_fields=['is_primary'])
        return Response(ResumeSerializer(resume, context={'request': request}).data)


class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all().order_by('-created_at')
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                return Interview.objects.filter(application__job__company__iexact=company_name).order_by('-created_at')
            return Interview.objects.filter(recruiter=user).order_by('-created_at')
        return Interview.objects.filter(application__applicant=user).order_by('-created_at')

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        if lookup_value and not str(lookup_value).isdigit():
            obj = queryset.filter(room_name=lookup_value).first()
            if obj is not None:
                self.check_object_permissions(self.request, obj)
                return obj
        return super().get_object()

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        quiz = getattr(application, 'technical_quiz', None)
        if quiz and (quiz.status != TechnicalQuiz.STATUS_COMPLETED or quiz.score is None or quiz.score < quiz.passing_score):
            raise PermissionDenied('The candidate must pass the technical quiz before an interview can be scheduled.')
        room_name = f"Vipseekers-{uuid.uuid4().hex[:12]}"
        meeting_url = f"https://meet.jit.si/{room_name}"
        interview = serializer.save(
            recruiter=self.request.user,
            candidate=application.applicant,
            room_name=room_name,
            meeting_url=meeting_url,
            meeting_link=serializer.validated_data.get('meeting_link') or meeting_url,
        )
        schedule_interview_reminders(interview)

        if application.status in {'APPLIED', 'RECRUITER_VIEWED'}:
            application.status = 'SHORTLISTED'
            application.save(update_fields=['status'])

        application.status = 'INTERVIEW_SCHEDULED'
        application.save(update_fields=['status'])

        conversation, _ = Conversation.objects.get_or_create(
            application=application,
            defaults={
                'job_seeker': application.applicant,
                'recruiter': application.job.recruiter,
            },
        )

        Notification.objects.create(
            user=application.applicant,
            title='Interview Scheduled',
            message=f'An interview has been scheduled for {application.job.title} on {interview.interview_date} at {interview.interview_time}.',
        )

        send_mail(
            subject=f"Interview scheduled — {application.job.title} at {application.job.company}",
            message=(
                f"Hi {application.applicant_name},\n\n"
                f"An interview has been scheduled for your application to {application.job.title}.\n"
                f"Date: {interview.interview_date}\n"
                f"Time: {interview.interview_time}\n"
                f"Mode: {interview.interview_mode}\n"
                f"Link / location: {interview.meeting_link or interview.meeting_url or interview.notes}\n\n"
                f"Room: {interview.room_name}\n"
                f"Good luck!"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[application.applicant_email or application.applicant.email],
            fail_silently=True,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if instance.status == Interview.STATUS_CANCELLED:
            instance.reminders.filter(status='PENDING').update(status='FAILED', last_error='Interview cancelled')
        else:
            schedule_interview_reminders(instance)
        new_status = serializer.validated_data.get('status', instance.status)
        if old_status != new_status:
            application_status = {
                Interview.STATUS_COMPLETED: 'TECHNICAL_INTERVIEW_COMPLETED',
                Interview.STATUS_CANCELLED: 'INTERVIEW_CANCELLED',
                Interview.STATUS_RESCHEDULED: 'INTERVIEW_SCHEDULED',
            }.get(new_status)
            if application_status:
                instance.application.status = application_status
                instance.application.save(update_fields=['status'])
            Notification.objects.create(
                user=instance.application.applicant,
                title='Interview Update',
                message=f'Your interview for {instance.application.job.title} has been updated to {new_status}.',
            )
        return Response(self.get_serializer(instance).data)


class JobQuizQuestionSetView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_job(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        if not (is_admin(request.user) or job.recruiter == request.user or (
            get_recruiter_company_name(request.user) and job.company.lower() == get_recruiter_company_name(request.user).lower()
        )):
            raise PermissionDenied('You cannot manage this job question set.')
        return job

    def get(self, request, job_id):
        job = self.get_job(request, job_id)
        return Response({
            'questions': job.quiz_questions,
            'status': job.quiz_questions_status,
            'pdf': job.quiz_question_pdf.url if job.quiz_question_pdf else None,
        })

    def post(self, request, job_id):
        job = self.get_job(request, job_id)
        uploaded = request.FILES.get('pdf')
        if not uploaded or not uploaded.name.lower().endswith('.pdf'):
            return Response({'detail': 'Upload a PDF question set.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            questions = parse_quiz_pdf(uploaded)
        except Exception as error:
            return Response({'detail': f'Could not read this PDF: {error}'}, status=status.HTTP_400_BAD_REQUEST)
        if not questions:
            return Response({'detail': 'No structured questions were found. Use numbered questions with A-D options and a Correct Answer line.'}, status=status.HTTP_400_BAD_REQUEST)
        job.quiz_question_pdf = uploaded
        job.quiz_questions = questions
        job.quiz_questions_status = 'PREVIEW'
        job.save(update_fields=['quiz_question_pdf', 'quiz_questions', 'quiz_questions_status'])
        return Response({'questions': questions, 'status': job.quiz_questions_status})

    def put(self, request, job_id):
        job = self.get_job(request, job_id)
        questions = request.data.get('questions')
        if not isinstance(questions, list) or not questions:
            return Response({'detail': 'Add at least one question before publishing.'}, status=status.HTTP_400_BAD_REQUEST)
        for question in questions:
            if not question.get('prompt') or len(question.get('options', [])) < 2 or question.get('correct_option') not in question.get('options', []):
                return Response({'detail': 'Every question needs a prompt, options, and a valid correct answer.'}, status=status.HTTP_400_BAD_REQUEST)
        job.quiz_questions = questions
        job.quiz_questions_status = 'PUBLISHED'
        job.save(update_fields=['quiz_questions', 'quiz_questions_status'])
        return Response({'questions': job.quiz_questions, 'status': job.quiz_questions_status})


class QuizQuestionSetPreviewView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get('pdf')
        if get_user_role(request.user) not in {'recruiter', 'admin'}:
            raise PermissionDenied('Only recruiters can preview quiz question sets.')
        if not uploaded or not uploaded.name.lower().endswith('.pdf'):
            return Response({'detail': 'Upload a PDF question set.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            questions = parse_quiz_pdf(uploaded)
        except Exception as error:
            return Response({'detail': f'Could not read this PDF: {error}'}, status=status.HTTP_400_BAD_REQUEST)
        if not questions:
            return Response({'detail': 'No structured questions were found. Use numbered questions with A-D options and a Correct Answer line.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'questions': questions, 'status': 'PREVIEW'})


class QuizAccessView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def get_quiz(self, token):
        return get_object_or_404(TechnicalQuiz.objects.select_related('application__job'), access_token=token)

    def get(self, request, token):
        quiz = self.get_quiz(token)
        application = quiz.application
        now = timezone.now()
        if application.status not in {'SHORTLISTED', 'RESUME_SHORTLISTED', 'QUIZ_SCHEDULED'}:
            return Response({'detail': 'This quiz is not available for this application.'}, status=status.HTTP_403_FORBIDDEN)
        if quiz.status == TechnicalQuiz.STATUS_COMPLETED:
            return Response({'detail': 'This quiz has already been submitted.'}, status=status.HTTP_409_CONFLICT)
        if application.job.quiz_starts_at and now < application.job.quiz_starts_at:
            return Response({'detail': 'The quiz window has not started yet.', 'starts_at': application.job.quiz_starts_at}, status=status.HTTP_403_FORBIDDEN)
        if application.job.quiz_ends_at and now > application.job.quiz_ends_at:
            return Response({'detail': 'The quiz window has expired.'}, status=status.HTTP_410_GONE)
        if not quiz.opened_at:
            quiz.opened_at = now
            quiz.save(update_fields=['opened_at', 'updated_at'])
        return Response({
            'application_id': application.id,
            'job_title': application.job.title,
            'questions': [{key: value for key, value in question.items() if key != 'correct_option'} for question in quiz.questions],
            'starts_at': application.job.quiz_starts_at,
            'ends_at': application.job.quiz_ends_at,
            'duration_minutes': application.job.quiz_duration_minutes,
            'instructions': application.job.quiz_instructions,
        })

    def post(self, request, token):
        quiz = self.get_quiz(token)
        application = quiz.application
        now = timezone.now()
        if quiz.status == TechnicalQuiz.STATUS_COMPLETED:
            return Response({'detail': 'This quiz has already been submitted.'}, status=status.HTTP_409_CONFLICT)
        if application.job.quiz_starts_at and now < application.job.quiz_starts_at:
            return Response({'detail': 'The quiz window has not started yet.'}, status=status.HTTP_403_FORBIDDEN)
        if application.job.quiz_ends_at and now > application.job.quiz_ends_at:
            return Response({'detail': 'The quiz window has expired.'}, status=status.HTTP_410_GONE)
        answers = request.data.get('answers')
        if not isinstance(answers, dict):
            return Response({'detail': 'Quiz answers must be an object.'}, status=status.HTTP_400_BAD_REQUEST)
        if not quiz.started_at:
            quiz.started_at = now
        correct = sum(1 for question in quiz.questions if answers.get(str(question.get('id'))) == question.get('correct_option'))
        score = round((correct / len(quiz.questions)) * 100, 2) if quiz.questions else 0
        quiz.score = score
        quiz.answers = answers
        quiz.status = TechnicalQuiz.STATUS_COMPLETED
        quiz.completed_at = now
        quiz.submitted_at = now
        quiz.save(update_fields=['started_at', 'score', 'answers', 'status', 'completed_at', 'submitted_at', 'updated_at'])
        passed = score >= quiz.passing_score
        application.status = 'QUIZ_PASSED' if passed else 'QUIZ_NOT_CLEARED'
        application.save(update_fields=['status'])
        wrong = len(quiz.questions) - correct
        email_sent = send_quiz_result_email(quiz, correct, wrong, score, passed)
        return Response({'score': score, 'correct': correct, 'wrong': wrong, 'passed': passed, 'email_sent': email_sent})


class QuizResendEmailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        if not recruiter_can_access_application(request.user, application):
            raise PermissionDenied('You cannot resend this quiz email.')
        quiz = ensure_quiz_attempt(application)
        if not quiz:
            return Response({'detail': 'Publish a job question set before sending a quiz.'}, status=status.HTTP_400_BAD_REQUEST)
        sent = send_quiz_email(quiz)
        return Response({'sent': sent, 'email_sent_at': quiz.email_sent_at, 'email_send_error': quiz.email_send_error, 'access_token': quiz.access_token})


class ApplicationWorkflowView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_application(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        if application.applicant != request.user and not recruiter_can_access_application(request.user, application):
            raise PermissionDenied('You cannot access this application workflow.')
        return application

    def get(self, request, application_id):
        application = self.get_application(request, application_id)
        normalized_status = normalize_application_status(application.status)
        quiz = getattr(application, 'technical_quiz', None)
        if normalized_status in {'SHORTLISTED', 'RESUME_SHORTLISTED', 'QUIZ_SCHEDULED'}:
            quiz = ensure_quiz_attempt(application) or quiz
        offer = getattr(application, 'offer_letter', None)
        quiz_data = TechnicalQuizSerializer(quiz).data if quiz else None
        if quiz_data and get_user_role(request.user) == 'jobseeker':
            quiz_data['questions'] = [
                {key: value for key, value in question.items() if key != 'correct_option'}
                for question in quiz_data['questions']
            ]
            if quiz_data['status'] != TechnicalQuiz.STATUS_COMPLETED:
                quiz_data['score'] = None
                quiz_data['answers'] = {}
        offer_data = None
        if offer and (get_user_role(request.user) != 'jobseeker' or offer.status != OfferLetter.STATUS_DRAFT):
            offer_data = OfferLetterSerializer(offer).data
        return Response({
            'status': normalized_status,
            'quiz': quiz_data,
            'offer_letter': offer_data,
            'timeline': {
                'resume_screening_at': application.job.resume_screening_at,
                'quiz_starts_at': application.job.quiz_starts_at,
                'quiz_ends_at': application.job.quiz_ends_at,
                'quiz_duration_minutes': application.job.quiz_duration_minutes,
                'quiz_instructions': application.job.quiz_instructions,
                'technical_interview_at': application.job.technical_interview_at,
                'technical_interview_mode': application.job.technical_interview_mode,
                'technical_interview_link': application.job.technical_interview_link,
                'technical_interview_instructions': application.job.technical_interview_instructions,
                'final_selection_at': application.job.final_selection_at,
            },
        })

    def put(self, request, application_id):
        application = self.get_application(request, application_id)
        if not recruiter_can_access_application(request.user, application):
            raise PermissionDenied('Only the recruiter can configure this workflow.')
        questions = request.data.get('questions')
        if not isinstance(questions, list) or not questions:
            return Response({'detail': 'Add at least one quiz question.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(questions) > 20:
            return Response({'detail': 'A quiz can contain at most 20 questions.'}, status=status.HTTP_400_BAD_REQUEST)
        for question in questions:
            if not isinstance(question, dict) or not question.get('id') or not question.get('prompt') or not isinstance(question.get('options'), list) or len(question['options']) < 2 or not question.get('correct_option'):
                return Response({'detail': 'Each question needs an id, prompt, at least two options, and a correct option.'}, status=status.HTTP_400_BAD_REQUEST)
            if question['correct_option'] not in question['options']:
                return Response({'detail': 'Each correct option must exist in its question options.'}, status=status.HTTP_400_BAD_REQUEST)
        quiz, _ = TechnicalQuiz.objects.update_or_create(
            application=application,
            defaults={
                'recruiter': request.user,
                'questions': questions,
                'passing_score': int(request.data.get('passing_score') or 70),
                'status': TechnicalQuiz.STATUS_PUBLISHED,
            },
        )
        Notification.objects.create(
            user=application.applicant,
            title='Technical quiz available',
            message=f'Complete the technical quiz for {application.job.title} to continue in the hiring process.',
            link=f'/applications/{application.id}',
        )
        return Response(TechnicalQuizSerializer(quiz).data)

    def post(self, request, application_id):
        application = self.get_application(request, application_id)
        if application.applicant != request.user:
            raise PermissionDenied('Only the applicant can submit this quiz.')
        quiz = get_object_or_404(TechnicalQuiz, application=application)
        if quiz.status != TechnicalQuiz.STATUS_PUBLISHED:
            return Response({'detail': 'This quiz is not available.'}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        if application.status not in {'SHORTLISTED', 'RESUME_SHORTLISTED', 'QUIZ_SCHEDULED'}:
            return Response({'detail': 'Only resume-shortlisted candidates can take this quiz.'}, status=status.HTTP_403_FORBIDDEN)
        if application.job.quiz_starts_at and now < application.job.quiz_starts_at:
            return Response({'detail': 'The quiz window has not started yet.'}, status=status.HTTP_403_FORBIDDEN)
        if application.job.quiz_ends_at and now > application.job.quiz_ends_at:
            return Response({'detail': 'The quiz window has closed.'}, status=status.HTTP_403_FORBIDDEN)
        answers = request.data.get('answers')
        if not isinstance(answers, dict):
            return Response({'detail': 'Quiz answers must be an object.'}, status=status.HTTP_400_BAD_REQUEST)
        correct = sum(1 for question in quiz.questions if answers.get(str(question.get('id'))) == question.get('correct_option'))
        score = round((correct / len(quiz.questions)) * 100, 2) if quiz.questions else 0
        quiz.score = score
        quiz.answers = answers
        quiz.status = TechnicalQuiz.STATUS_COMPLETED
        quiz.completed_at = timezone.now()
        quiz.save(update_fields=['score', 'answers', 'status', 'completed_at', 'updated_at'])
        passed = score >= quiz.passing_score
        application.status = 'QUIZ_PASSED' if passed else 'QUIZ_NOT_CLEARED'
        application.save(update_fields=['status'])
        wrong = len(quiz.questions) - correct
        email_sent = send_quiz_result_email(quiz, correct, wrong, score, passed)
        Notification.objects.create(
            user=application.job.recruiter,
            title='Technical quiz completed',
            message=f'{application.applicant_name or application.applicant.username} scored {score}% on the technical quiz for {application.job.title}.',
            link='/recruiter/applications',
        )
        return Response({'quiz': TechnicalQuizSerializer(quiz).data, 'passed': passed, 'score': score, 'correct': correct, 'wrong': wrong, 'email_sent': email_sent})


class ApplicationOfferView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_application(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        if application.applicant != request.user and not recruiter_can_access_application(request.user, application):
            raise PermissionDenied('You cannot access this offer.')
        return application

    def put(self, request, application_id):
        application = self.get_application(request, application_id)
        if not recruiter_can_access_application(request.user, application):
            raise PermissionDenied('Only the recruiter can create an offer letter.')
        if application.status not in {'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'TECHNICAL_INTERVIEW_COMPLETED', 'TECHNICAL_INTERVIEW_PASSED', 'SELECTED'}:
            return Response({'detail': 'Complete the technical interview before sending an offer.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OfferLetterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        offer, _ = OfferLetter.objects.update_or_create(
            application=application,
            defaults={**serializer.validated_data, 'recruiter': request.user, 'status': OfferLetter.STATUS_SENT, 'sent_at': timezone.now()},
        )
        application.status = 'OFFER_SENT'
        application.save(update_fields=['status'])
        recipient = application.applicant_email or application.applicant.email
        email_sent = False
        email_error = ''
        if recipient:
            try:
                send_mail(
                    subject=f"Offer letter: {application.job.title}",
                    message=(
                        f"Hi {application.applicant_name or application.applicant.username},\n\n"
                        f"Congratulations. We are pleased to offer you the role of {application.job.title} at {application.job.company}.\n\n"
                        f"Salary: {offer.salary}\n"
                        f"Joining date: {offer.joining_date}\n"
                        f"Terms: {offer.terms or 'As discussed with the recruiter.'}\n\n"
                        f"Please sign in to your Vipseekers application dashboard to respond to this offer.\n\n"
                        f"Regards,\nVipseekers Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as error:
                email_error = str(error)
        Notification.objects.create(
            user=application.applicant,
            title='Offer letter received',
            message=f'Your offer letter for {application.job.title} is ready to review.',
            link=f'/applications/{application.id}',
        )
        response_data = OfferLetterSerializer(offer).data
        response_data['email_sent'] = email_sent
        response_data['email_error'] = email_error
        return Response(response_data)

    def post(self, request, application_id):
        application = self.get_application(request, application_id)
        if application.applicant != request.user:
            raise PermissionDenied('Only the applicant can respond to an offer.')
        offer = get_object_or_404(OfferLetter, application=application)
        response_status = request.data.get('status')
        if offer.status != OfferLetter.STATUS_SENT or response_status not in {OfferLetter.STATUS_ACCEPTED, OfferLetter.STATUS_DECLINED}:
            return Response({'detail': 'This offer cannot be updated.'}, status=status.HTTP_400_BAD_REQUEST)
        offer.status = response_status
        offer.responded_at = timezone.now()
        offer.save(update_fields=['status', 'responded_at', 'updated_at'])
        application.status = 'JOINED' if response_status == OfferLetter.STATUS_ACCEPTED else 'SELECTED'
        application.save(update_fields=['status'])
        Notification.objects.create(
            user=offer.recruiter,
            title=f'Offer {response_status.lower()}',
            message=f'{application.applicant_name or application.applicant.username} has {response_status.lower()} your offer for {application.job.title}.',
            link='/recruiter/applications',
        )
        return Response(OfferLetterSerializer(offer).data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.user != request.user:
            raise PermissionDenied('You do not have permission to modify this notification.')
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'detail': 'Notification marked as read'})


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return User.objects.all().order_by('id')
        return User.objects.filter(id=user.id)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        target = self.get_queryset().filter(pk=pk).first()
        if target is None:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if target.id == request.user.id:
            return Response({'detail': 'You cannot suspend your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        if is_admin(target):
            return Response({'detail': 'Admin accounts cannot be suspended.'}, status=status.HTTP_400_BAD_REQUEST)

        target.is_active = not target.is_active
        target.save(update_fields=['is_active'])
        log_admin_action(
            request.user,
            'USER_REACTIVATED' if target.is_active else 'USER_SUSPENDED',
            'user',
            target.id,
            target_label=target.email or target.username,
        )
        return Response(UserSerializer(target, context={'request': request}).data)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [FormParser, MultiPartParser, JSONParser]
    # 'post' stays enabled for the upload_logo action below; the default create()
    # route is explicitly disabled since companies are only created via registration.
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Company.objects.all().order_by('-created_at')
        if get_user_role(user) == 'recruiter':
            return Company.objects.filter(recruiters__user=user).distinct()
        return Company.objects.none()

    def create(self, request, *args, **kwargs):
        return Response({'detail': 'Companies can only be created via registration.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['post'], url_path='logo')
    def upload_logo(self, request, pk=None):
        company = self.get_queryset().filter(pk=pk).first()
        if company is None:
            return Response({'detail': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)

        logo_file = request.FILES.get('logo')
        if not logo_file:
            return Response({'detail': 'A logo file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        company.logo = logo_file
        company.logo_status = 'pending'
        company.save(update_fields=['logo', 'logo_status'])
        return Response(CompanySerializer(company, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='verification')
    def submit_verification(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        company = Company.objects.filter(pk=pk).first()
        if company is None:
            return Response({'detail': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        company_bool_fields = ['website_verified', 'registration_verified', 'address_verified']
        update_fields = []
        for field in company_bool_fields:
            if field in data:
                setattr(company, field, _parse_bool(data.get(field)))
                update_fields.append(field)

        if 'logo_status' in data and data.get('logo_status') in dict(Company.LOGO_STATUS_CHOICES):
            company.logo_status = data.get('logo_status')
            update_fields.append('logo_status')

        if 'admin_review_status' in data and data.get('admin_review_status') in dict(Company.ADMIN_REVIEW_STATUS_CHOICES):
            company.admin_review_status = data.get('admin_review_status')
            update_fields.append('admin_review_status')

        if 'admin_notes' in data:
            company.admin_notes = data.get('admin_notes') or ''
            update_fields.append('admin_notes')

        if update_fields:
            company.reviewed_at = timezone.now()
            update_fields.append('reviewed_at')
            company.save(update_fields=update_fields)

        recruiter_bool_fields = {
            'recruiter_email_verified': 'email_verified',
            'recruiter_phone_verified': 'phone_verified',
            'recruiter_identity_verified': 'identity_verified',
        }
        recruiter_updates = {model_field: _parse_bool(data.get(payload_field)) for payload_field, model_field in recruiter_bool_fields.items() if payload_field in data}
        if recruiter_updates:
            for recruiter_profile in company.recruiters.all():
                for field, value in recruiter_updates.items():
                    setattr(recruiter_profile, field, value)
                recruiter_profile.save(update_fields=list(recruiter_updates.keys()))

        if update_fields or recruiter_updates:
            changed = [f for f in update_fields if f != 'reviewed_at'] + list(recruiter_updates.keys())
            log_admin_action(
                request.user,
                'COMPANY_VERIFICATION_UPDATED',
                'company',
                company.id,
                target_label=company.name,
                details=f"Updated: {', '.join(changed)}" if changed else '',
            )

        return Response(CompanySerializer(company, context={'request': request}).data)


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ('true', '1', 'yes', 'on')


def get_or_create_recruiter_profile(user):
    """Some recruiters (e.g. Google sign-in) get created without a Company/RecruiterProfile,
    since there's no company info to collect at that point. Lazily create a placeholder the
    first time they touch a recruiter-profile endpoint, same as UserProfile.get_or_create."""
    profile = getattr(user, 'recruiter_profile', None)
    if profile is not None:
        return profile
    company_name = f"{(user.first_name or user.username).strip()}'s Company (#{user.id})"
    company = Company.objects.create(name=company_name)
    return RecruiterProfile.objects.create(user=user, company=company)


class RecruiterProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        profile = get_or_create_recruiter_profile(request.user)
        return Response(RecruiterProfileSerializer(profile, context={'request': request}).data)

    def patch(self, request):
        profile = get_or_create_recruiter_profile(request.user)
        serializer = RecruiterProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        # Only self-editable fields — email_verified/phone_verified/identity_verified are
        # read_only on the serializer, so they're silently ignored if sent here.
        serializer.save()
        return Response(serializer.data)


class VerifyRecruiterEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        profile = get_or_create_recruiter_profile(request.user)

        code = request.data.get('otp')
        otp_obj = LoginOTP.objects.filter(email__iexact=request.user.email, code=code).order_by('-created_at').first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save(update_fields=['is_used'])

        profile.email_verified = True
        profile.save(update_fields=['email_verified'])
        return Response(RecruiterProfileSerializer(profile, context={'request': request}).data)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        totals = {
            'users': User.objects.count(),
            'jobseekers': User.objects.filter(last_name='jobseeker').count(),
            'recruiters': User.objects.filter(last_name='recruiter').count(),
            'admins': User.objects.filter(last_name='admin').count(),
            'jobs': Job.objects.count(),
            'active_jobs': Job.objects.filter(status=Job.STATUS_ACTIVE).count(),
            'applications': Application.objects.count(),
            'companies': Company.objects.count(),
        }

        status_counts = {
            status: Application.objects.filter(status=status).count()
            for status, _ in Application.APPLICATION_STATUS_CHOICES
        }

        recent_applications = ApplicationSerializer(
            Application.objects.order_by('-applied_at')[:5],
            many=True,
            context={'request': request},
        ).data

        recent_jobs = JobSerializer(Job.objects.order_by('-posted_at')[:5], many=True, context={'request': request}).data
        recent_users = UserSerializer(User.objects.order_by('-id')[:5], many=True, context={'request': request}).data

        return Response({
            'totals': totals,
            'applications_by_status': status_counts,
            'recent_applications': recent_applications,
            'recent_jobs': recent_jobs,
            'recent_users': recent_users,
        })


class AdminAuditLogView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        logs = AdminAuditLog.objects.select_related('admin').all()[:200]
        return Response(AdminAuditLogSerializer(logs, many=True).data)


class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all().order_by('-updated_at')
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        queryset = Conversation.objects.all().order_by('-updated_at')
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                queryset = queryset.filter(application__job__company__iexact=company_name)
            else:
                queryset = queryset.filter(recruiter=user)
        else:
            queryset = queryset.filter(job_seeker=user)

        application_id = self.request.query_params.get('application')
        if application_id:
            queryset = queryset.filter(application_id=application_id)

        return queryset

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        user = self.request.user
        if application.applicant != user and get_user_role(user) != 'recruiter':
            raise PermissionDenied('You can only create conversations for your own applications.')

        recruiter = application.job.recruiter
        if get_user_role(user) == 'recruiter' and recruiter != user and get_recruiter_company_name(user) and application.job.company.lower() != get_recruiter_company_name(user).lower():
            raise PermissionDenied('You can only create conversations for your own company applications.')

        serializer.save(
            job_seeker=application.applicant,
            recruiter=recruiter,
        )

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                unread = Message.objects.filter(
                    conversation__application__job__company__iexact=company_name,
                    is_read=False,
                ).exclude(sender=user).count()
            else:
                unread = Message.objects.filter(
                    conversation__recruiter=user,
                    is_read=False,
                ).exclude(sender=user).count()
        else:
            unread = Message.objects.filter(
                conversation__job_seeker=user,
                is_read=False,
            ).exclude(sender=user).count()
        return Response({'unread_count': unread})


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                queryset = Message.objects.filter(conversation__application__job__company__iexact=company_name)
            else:
                queryset = Message.objects.filter(conversation__application__job__recruiter=user)
        else:
            queryset = Message.objects.filter(conversation__job_seeker=user)

        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        return queryset

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        user = self.request.user
        is_recruiter = get_user_role(user) == 'recruiter'
        company_name = get_recruiter_company_name(user) if is_recruiter else None

        if is_recruiter:
            if company_name and conversation.application.job.company.lower() != company_name.lower():
                raise PermissionDenied('You cannot message on this conversation.')
            if conversation.recruiter != user and conversation.application.job.recruiter != user:
                raise PermissionDenied('You cannot message on this conversation.')
        else:
            if conversation.job_seeker != user:
                raise PermissionDenied('You cannot message on this conversation.')

        if not is_recruiter:
            allowed_statuses = ['RECRUITER_VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_SENT', 'SELECTED']
            if conversation.application.status not in allowed_statuses:
                raise PermissionDenied('Messages may only be sent after the recruiter has reviewed or moved your application forward.')

        message = serializer.save(sender=user, sender_type=(Message.SENDER_RECRUITER if is_recruiter else Message.SENDER_JOBSEEKER))
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        recipient = conversation.job_seeker if is_recruiter else conversation.recruiter
        Notification.objects.create(
            user=recipient,
            title='New message',
            message=f'New message on your application for {conversation.application.job.title}.',
            type='message',
            link=f'/messages/{conversation.id}',
        )

        return message

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        conversation_id = request.data.get('conversation')
        if not conversation_id:
            return Response({'detail': 'Conversation ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        conversation = Conversation.objects.filter(id=conversation_id).first()
        if not conversation:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if get_user_role(user) == 'recruiter':
            allowed = conversation.recruiter == user or (get_recruiter_company_name(user) and conversation.application.job.company.lower() == get_recruiter_company_name(user).lower())
        else:
            allowed = conversation.job_seeker == user

        if not allowed:
            return Response({'detail': 'Not allowed to mark messages for this conversation.'}, status=status.HTTP_403_FORBIDDEN)

        updated_count = Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=user).update(is_read=True)
        return Response({'marked_count': updated_count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        message = self.get_object()
        user = request.user
        if get_user_role(user) == 'recruiter':
            allowed = message.conversation.recruiter == user or message.conversation.application.job.recruiter == user or (get_recruiter_company_name(user) and message.conversation.application.job.company.lower() == get_recruiter_company_name(user).lower())
        else:
            allowed = message.conversation.job_seeker == user

        if not allowed:
            return Response({'detail': 'Not allowed to mark this message.'}, status=status.HTTP_403_FORBIDDEN)

        message.is_read = True
        message.save(update_fields=['is_read'])
        return Response({'detail': 'Marked read'})


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        code = LoginOTP.generate_code()
        LoginOTP.objects.create(email=email, code=code)

        try:
            send_mail(
                subject='Your Smart Job Portal OTP',
                message=f'Your OTP is {code}. It expires in 5 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            return Response({'message': 'OTP sent to your email'}, status=status.HTTP_200_OK)

        return Response({'message': 'OTP sent to your email'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp')

        otp_obj = LoginOTP.objects.filter(email=email, code=code).order_by('-created_at').first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save(update_fields=['is_used'])

        user, _ = User.objects.get_or_create(email=email, defaults={'username': email})
        tokens = get_tokens_for_user(user, get_user_role(user))
        return Response({
            'message': 'OTP verified',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user_type': tokens['user_type'],
            'user': tokens['user'],
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            UserProfile.objects.get_or_create(user=user)
            user_type = serializer.validated_data.get('user_type', 'jobseeker')
            tokens = get_tokens_for_user(user, user_type)
            return Response({
                'message': 'Registration successful',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user_type': tokens['user_type'],
                'user': tokens['user'],
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        if not profile.profile_completed:
            profile.profile_completed = bool(
                profile.mobile_number and profile.headline and profile.city and profile.country
            )
            profile.save(update_fields=['profile_completed'])
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        return self.put(request)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        token = request.data.get('id_token') or request.data.get('credential')
        user_type = request.data.get('user_type', 'jobseeker')
        if user_type not in ['jobseeker', 'recruiter', 'admin']:
            user_type = 'jobseeker'

        if not token:
            return Response({'error': 'Google ID token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get('email')
        email_verified = id_info.get('email_verified', False)
        if not email or not email_verified:
            return Response({'error': 'Google account email verification failed'}, status=status.HTTP_400_BAD_REQUEST)

        normalized_email = email.strip().lower()
        user = User.objects.filter(email=normalized_email).first()
        if user:
            existing_role = get_user_role(user)
            if existing_role != user_type:
                return Response(
                    {'error': f'Account exists as {existing_role}. Please sign in with the correct role.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.first_name and id_info.get('name'):
                user.first_name = id_info.get('name')
                user.save(update_fields=['first_name'])
        else:
            if user_type == 'admin':
                return Response(
                    {'error': 'Admin accounts must be created by an existing administrator.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            user = User.objects.create(
                username=normalized_email,
                email=normalized_email,
                first_name=id_info.get('name', ''),
                last_name=user_type,
            )

        UserProfile.objects.get_or_create(user=user)

        tokens = get_tokens_for_user(user, get_user_role(user))
        return Response({
            'message': 'Login successful',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user_type': tokens['user_type'],
            'user': tokens['user'],
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].strip().lower()
            password = serializer.validated_data['password']

            user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
            if user is None:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=user.username, password=password)
            if user is None:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)
            
            user_type = get_user_role(user)
            tokens = get_tokens_for_user(user, user_type)
            
            return Response({
                'message': 'Login successful',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user_type': tokens['user_type'],
                'user': tokens['user'],
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
        if user:
            code = LoginOTP.generate_code()
            LoginOTP.objects.create(email=email, code=code)
            try:
                send_mail(
                    subject='Reset your Smart Job Portal password',
                    message=f'Your password reset code is {code}. It expires in 5 minutes. '
                            f'If you did not request this, you can safely ignore this email.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                pass

        # Always return the same response whether or not the account exists, so this
        # endpoint can't be used to enumerate registered emails.
        return Response(
            {'message': 'If an account exists for that email, a reset code has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({'error': 'Email, OTP, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = LoginOTP.objects.filter(email__iexact=email, code=code).order_by('-created_at').first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
        if not user:
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save(update_fields=['is_used'])

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({'message': 'Password updated successfully. You can now sign in.'}, status=status.HTTP_200_OK)
