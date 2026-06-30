from rest_framework import viewsets, status
from rest_framework.decorators import action
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
from .models import Job, Application
from .serializers import (
    JobSerializer,
    ApplicationSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
)


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

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(recruiter=self.request.user)
        else:
            raise PermissionError('Authentication required to post jobs')

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
        user_type = user.last_name if user.last_name in ['jobseeker', 'recruiter'] else 'jobseeker'
        
        if user_type == 'recruiter':
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
        user_type = user.last_name if user.last_name in ['jobseeker', 'recruiter'] else 'jobseeker'

        if user_type == 'recruiter' and instance.job.recruiter == user and instance.status == 'Pending':
            instance.status = 'Viewed'
            instance.viewed_at = timezone.now()
            instance.save(update_fields=['status', 'viewed_at'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='grouped-by-job')
    def grouped_by_job(self, request):
        """Return recruiter applications grouped by posted job."""
        user = request.user
        user_type = user.last_name if user.last_name in ['jobseeker', 'recruiter'] else 'jobseeker'
        
        if user_type != 'recruiter':
            return Response({'detail': 'Only recruiters can view grouped job applications.'}, status=status.HTTP_403_FORBIDDEN)

        jobs = Job.objects.filter(recruiter=user).order_by('-posted_at')
        grouped = []
        for job in jobs:
            applications = Application.objects.filter(job=job).order_by('-applied_at')
            grouped.append({
                'job': JobSerializer(job).data,
                'applications': ApplicationSerializer(applications, many=True).data,
            })
        return Response(grouped)


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
            
            user_type = user.last_name if user.last_name in ['jobseeker', 'recruiter'] else 'jobseeker'
            tokens = get_tokens_for_user(user, user_type)
            
            return Response({
                'message': 'Login successful',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user_type': tokens['user_type'],
                'user': tokens['user'],
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
