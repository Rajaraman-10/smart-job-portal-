from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
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

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-posted_at')
    serializer_class = JobSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(recruiter=self.request.user)
        else:
            raise PermissionError('Authentication required to post jobs')

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all().order_by('-applied_at')
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        applicant_user = self.request.user
        applicant_name = serializer.validated_data.get('applicant_name') or applicant_user.first_name or applicant_user.username
        applicant_email = serializer.validated_data.get('applicant_email') or applicant_user.email

        application = serializer.save(
            applicant=applicant_user,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
        )
        return application


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
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = authenticate(username=user.username, password=password)
            if user is None:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)
            
            user_type = user.first_name if user.first_name in ['jobseeker', 'recruiter'] else 'jobseeker'
            tokens = get_tokens_for_user(user, user_type)
            
            return Response({
                'message': 'Login successful',
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user_type': tokens['user_type'],
                'user': tokens['user'],
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
