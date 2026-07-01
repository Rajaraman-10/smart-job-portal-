from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import Job, Application, Message, RecruiterProfile, Bookmark, Interview
from .serializers import (
    JobSerializer,
    ApplicationSerializer,
    MessageSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    BookmarkSerializer,
    InterviewSerializer,
)


def get_user_role(user):
    return user.last_name if user.last_name in ['jobseeker', 'recruiter'] else 'jobseeker'


def get_recruiter_company_name(user):
    profile = getattr(user, 'recruiter_profile', None)
    return profile.company.name if profile and profile.company else None


def get_tokens_for_user(user, user_type='jobseeker'):
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
        # Read permissions are allowed to any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions are only allowed to the recruiter who posted the job
        if isinstance(obj, Job):
            return obj.recruiter == request.user
        return False


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-posted_at')
    serializer_class = JobSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsRecruiterOrReadOnly]

    def get_queryset(self):
        category = self.request.query_params.get('category')
        queryset = Job.objects.all().order_by('-posted_at')
        if category and category != 'All Jobs':
            queryset = queryset.filter(category__iexact=category)

        user = self.request.user
        if not user.is_authenticated:
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
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """
        Filter applications based on user role:
        - Recruiters: See applications for jobs they posted
        - Job Seekers: See their own applications
        """
        user = self.request.user
        user_type = get_user_role(user)
        
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

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        user_type = get_user_role(user)
        company_name = get_recruiter_company_name(user)
        has_company_access = False
        if user_type == 'recruiter':
            has_company_access = company_name and instance.job.company.lower() == company_name.lower()

        if user_type == 'recruiter' and (instance.job.recruiter == user or has_company_access) and instance.status == 'Pending':
            instance.status = 'Viewed'
            instance.viewed_at = timezone.now()
            instance.save(update_fields=['status', 'viewed_at'])

        if instance.messages.filter(is_read=False).exclude(sender=request.user).exists():
            instance.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        serializer = self.get_serializer(instance)
        response_data = serializer.data
        response_data['unread_message_count'] = instance.messages.filter(is_read=False).exclude(sender=request.user).count()
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

    def perform_create(self, serializer):
        interview = serializer.save()
        application = interview.application
        send_mail(
            subject=f"Interview scheduled — {application.job.title} at {application.job.company}",
            message=(
                f"Hi {application.applicant_name},\n\n"
                f"An interview has been scheduled for your application to {application.job.title}.\n"
                f"When: {interview.scheduled_at}\n"
                f"Mode: {interview.mode}\n"
                f"Details: {interview.location_or_link or interview.notes}\n\n"
                f"Good luck!"
            ),
            from_email=None,
            recipient_list=[application.applicant_email],
            fail_silently=True,
        )


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
                queryset = Message.objects.filter(application__job__company__iexact=company_name)
            else:
                queryset = Message.objects.filter(application__job__recruiter=user)
        else:
            queryset = Message.objects.filter(application__applicant=user)

        application_id = self.request.query_params.get('application')
        if application_id:
            queryset = queryset.filter(application_id=application_id)

        return queryset

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        user = self.request.user
        is_recruiter = get_user_role(user) == 'recruiter'

        if is_recruiter:
            company_name = get_recruiter_company_name(user)
            if company_name and application.job.company.lower() != company_name.lower():
                raise PermissionDenied('You cannot message on this application.')
            if application.job.recruiter != user and not (company_name and application.job.company.lower() == company_name.lower()):
                raise PermissionDenied('You cannot message on this application.')
        if not is_recruiter and application.applicant != user:
            raise PermissionDenied('You cannot message on this application.')
        if application.status not in ['Viewed', 'Approved', 'Rejected']:
            raise PermissionDenied('Messages may only be sent after the recruiter has viewed the application.')

        serializer.save(sender=user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                unread = Message.objects.filter(
                    application__job__company__iexact=company_name,
                    is_read=False,
                ).exclude(sender=user).count()
            else:
                unread = Message.objects.filter(
                    application__job__recruiter=user,
                    is_read=False,
                ).exclude(sender=user).count()
        else:
            unread = Message.objects.filter(
                application__applicant=user,
                is_read=False,
            ).exclude(sender=user).count()
        return Response({'unread_count': unread})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        application_id = request.data.get('application')
        if not application_id:
            return Response({'detail': 'Application ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            if company_name:
                allowed = Application.objects.filter(id=application_id, job__company__iexact=company_name).exists()
            else:
                allowed = Application.objects.filter(id=application_id, job__recruiter=user).exists()
        else:
            allowed = Application.objects.filter(id=application_id, applicant=user).exists()

        if not allowed:
            return Response({'detail': 'Not allowed to mark messages for this application.'}, status=status.HTTP_403_FORBIDDEN)

        updated_count = Message.objects.filter(
            application_id=application_id,
            is_read=False
        ).exclude(sender=user).update(is_read=True)
        return Response({'marked_count': updated_count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        message = self.get_object()
        user = request.user
        if get_user_role(user) == 'recruiter':
            company_name = get_recruiter_company_name(user)
            allowed = message.application.job.recruiter == user or (company_name and message.application.job.company.lower() == company_name.lower())
        else:
            allowed = message.application.applicant == user

        if not allowed:
            return Response({'detail': 'Not allowed to mark this message.'}, status=status.HTTP_403_FORBIDDEN)

        message.is_read = True
        message.save(update_fields=['is_read'])
        return Response({'detail': 'Marked read'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
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
