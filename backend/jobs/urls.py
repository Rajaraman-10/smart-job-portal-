from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobViewSet,
    ApplicationViewSet,
    MessageViewSet,
    BookmarkViewSet,
    InterviewViewSet,
    RegisterView,
    LoginView,
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'interviews', InterviewViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
]
