from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Job, Application, OTP
from .serializers import (
    JobSerializer,
    ApplicationSerializer,
    UserSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
)
import random
import string
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except Exception:
    TWILIO_AVAILABLE = False


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
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
        applicant_name = serializer.validated_data.get('applicant_name') or applicant_user.username
        applicant_email = serializer.validated_data.get('applicant_email', '')

        application = serializer.save(
            applicant=applicant_user,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
        )
        return application




class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def _send_otp_sms(self, phone_number, otp_code):
        """Send OTP via SMS using Twilio only if enabled."""
        if not getattr(settings, 'TWILIO_SEND_SMS', False) or not TWILIO_AVAILABLE:
            print(f"\n{'='*60}")
            print(f"SMS delivery disabled or Twilio unavailable")
            print(f"{'='*60}")
            print(f"Mobile: {phone_number}")
            print(f"OTP: {otp_code}")
            print(f"{'='*60}\n")
            return None
        try:
            account_sid = settings.TWILIO_ACCOUNT_SID
            auth_token = settings.TWILIO_AUTH_TOKEN
            twilio_phone = settings.TWILIO_PHONE_NUMBER
            if not all([account_sid, auth_token, twilio_phone]):
                print("Twilio credentials not set")
                return None
            client = Client(account_sid, auth_token)
            if not phone_number.startswith('+'):
                phone_number = f'+91{phone_number}'
            message = client.messages.create(
                body=f"Your Smart Job Portal OTP is: {otp_code}. Valid for 10 minutes.",
                from_=twilio_phone,
                to=phone_number
            )
            print(f"SMS sent to {phone_number}, sid={message.sid}")
            return message.sid
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return None

    def post(self, request):
        try:
            serializer = SendOTPSerializer(data=request.data)
            if serializer.is_valid():
                mobile_number = serializer.validated_data['mobile_number']
                otp_code = ''.join(random.choices(string.digits, k=6))
                otp, created = OTP.objects.get_or_create(mobile_number=mobile_number)
                otp.otp_code = otp_code
                otp.is_verified = False
                otp.created_at = timezone.now()
                otp.save()

                sms_sid = self._send_otp_sms(mobile_number, otp_code)
                response_data = {
                    'message': 'OTP generated successfully',
                    'otp_code': otp_code,
                }
                if sms_sid:
                    response_data['sms_sid'] = sms_sid
                return Response(response_data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            mobile_number = serializer.validated_data['mobile_number']
            otp_code = serializer.validated_data['otp_code'].strip()
            user_type = serializer.validated_data['user_type']
            try:
                otp = OTP.objects.get(mobile_number=mobile_number)
                if otp.is_expired():
                    return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
                if otp.otp_code != otp_code:
                    return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
                user, created = User.objects.get_or_create(
                    username=mobile_number,
                    defaults={'first_name': user_type}
                )
                otp.is_verified = True
                otp.save()
                tokens = get_tokens_for_user(user)
                return Response({'message': 'Login successful', 'access': tokens['access'], 'refresh': tokens['refresh'], 'user': UserSerializer(user).data, 'user_type': user_type}, status=status.HTTP_200_OK)
            except OTP.DoesNotExist:
                return Response({'error': 'OTP not found. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
