from django.urls import path, include
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
    AnalyticsView,
    RegisterView,
    LoginView,
    GoogleLoginView,
    RequestOTPView,
    VerifyOTPView,
    UserProfileView,
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

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]
