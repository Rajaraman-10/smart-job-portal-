import uuid

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
from .models import Conversation, Job, Application, Message, Company, UserProfile, Bookmark, Interview, Notification, LoginOTP
from .resume_scanner import scan_application
from .status_utils import normalize_application_status, to_display_application_status
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
)


def get_user_role(user):
    return user.last_name if user.last_name in ['jobseeker', 'recruiter', 'admin'] else 'jobseeker'


def is_admin(user):
    return get_user_role(user) == 'admin'


def get_recruiter_company_name(user):
    profile = getattr(user, 'recruiter_profile', None)
    return profile.company.name if profile and profile.company else None


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

        if not user.is_authenticated or get_user_role(user) != 'recruiter':
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
        
        if user_type == 'admin':
            return Application.objects.all().order_by('-applied_at')

        if user_type == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                return Application.objects.filter(job__company__iexact=company_name).order_by('-applied_at')
            return Application.objects.filter(job__recruiter=user).order_by('-applied_at')
        return Application.objects.filter(applicant=user).order_by('-applied_at')

    def perform_create(self, serializer):
        applicant_user = self.request.user
        applicant_name = serializer.validated_data.get('applicant_name') or applicant_user.first_name or applicant_user.username
        applicant_email = serializer.validated_data.get('applicant_email') or applicant_user.email

        application = serializer.save(
            applicant=applicant_user,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
        )

        try:
            scan_result = scan_application(application)
            application.ai_match_score = scan_result['ai_match_score']
            application.ai_matched_skills = scan_result['ai_matched_skills']
            application.ai_missing_skills = scan_result['ai_missing_skills']
            application.ai_scanned_at = timezone.now()
            application.save(update_fields=['ai_match_score', 'ai_matched_skills', 'ai_missing_skills', 'ai_scanned_at'])
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
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        new_status = serializer.validated_data.get('status', instance.status)
        display_status = to_display_application_status(new_status)
        if old_status != new_status:
            recipient = instance.applicant_email or instance.applicant.email
            if recipient:
                subject = f"Your application status: {display_status}"
                message = (
                    f"Hi {instance.applicant_name or instance.applicant.first_name or instance.applicant.username},\n\n"
                    f"Your application for '{instance.job.title}' has moved to '{display_status}'.\n\n"
                    f"Regards,\nVipseekers Team"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [recipient],
                    fail_silently=True,
                )

            Notification.objects.create(
                user=instance.applicant,
                title=f"Application status updated",
                message=f"Your application for {instance.job.title} is now {display_status}.",
            )

        response_data = serializer.data
        response_data['status'] = to_display_application_status(response_data.get('status'))
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
        response_data['status'] = to_display_application_status(response_data.get('status'))
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


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
        room_name = f"vipseekers-{uuid.uuid4().hex[:12]}"
        meeting_url = f"https://meet.jit.si/{room_name}"
        interview = serializer.save(
            recruiter=self.request.user,
            candidate=application.applicant,
            room_name=room_name,
            meeting_url=meeting_url,
            meeting_link=serializer.validated_data.get('meeting_link') or meeting_url,
        )

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
        new_status = serializer.validated_data.get('status', instance.status)
        if old_status != new_status:
            Notification.objects.create(
                user=instance.application.applicant,
                title='Interview Update',
                message=f'Your interview for {instance.application.job.title} has been updated to {new_status}.',
            )
        return Response(self.get_serializer(instance).data)


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


class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Company.objects.all().order_by('-created_at')
        return Company.objects.none()


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
