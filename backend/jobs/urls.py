from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationViewSet,
    JobViewSet,
    ApplicationViewSet,
    MessageViewSet,
    BookmarkViewSet,
    ResumeViewSet,
    InterviewViewSet,
    NotificationViewSet,
    UserViewSet,
    CompanyViewSet,
    AdminDashboardView,
    AdminAuditLogView,
    AnalyticsView,
    RegisterView,
    LoginView,
    GoogleLoginView,
    RequestOTPView,
    VerifyOTPView,
    UserProfileView,
    RecruiterProfileView,
    VerifyRecruiterEmailOTPView,
    RequestPasswordResetView,
    ResetPasswordView,
    ApplicationWorkflowView,
    ApplicationOfferView,
    JobQuizQuestionSetView,
    QuizQuestionSetPreviewView,
    QuizAccessView,
    QuizResendEmailView,
    AnalyticsExportView,
    CandidateCompareView,
    RecommendedJobsView,
    InterviewFeedbackView,
    ReminderViewSet,
    SubscriptionPlanViewSet,
    SubscriptionView,
    PaymentWebhookView,
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'users', UserViewSet, basename='user')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')

urlpatterns = [
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('analytics/export/', AnalyticsExportView.as_view(), name='analytics-export'),
    path('applications/compare/', CandidateCompareView.as_view(), name='application-compare'),
    path('jobs/recommended/', RecommendedJobsView.as_view(), name='recommended-jobs'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/audit-log/', AdminAuditLogView.as_view(), name='admin-audit-log'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/recruiter-profile/', RecruiterProfileView.as_view(), name='recruiter-profile'),
    path('auth/verify-recruiter-email/', VerifyRecruiterEmailOTPView.as_view(), name='verify-recruiter-email'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('applications/<int:application_id>/workflow/', ApplicationWorkflowView.as_view(), name='application-workflow'),
    path('applications/<int:application_id>/offer/', ApplicationOfferView.as_view(), name='application-offer'),
    path('jobs/<int:job_id>/quiz-question-set/', JobQuizQuestionSetView.as_view(), name='job-quiz-question-set'),
    path('jobs/quiz-question-set/preview/', QuizQuestionSetPreviewView.as_view(), name='quiz-question-set-preview'),
    path('quiz/access/<str:token>/', QuizAccessView.as_view(), name='quiz-access'),
    path('applications/<int:application_id>/quiz/resend/', QuizResendEmailView.as_view(), name='quiz-resend-email'),
    path('interviews/<int:interview_id>/feedback/', InterviewFeedbackView.as_view(), name='interview-feedback'),
    path('subscription/', SubscriptionView.as_view(), name='subscription'),
    path('payments/webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('', include(router.urls)),
]
