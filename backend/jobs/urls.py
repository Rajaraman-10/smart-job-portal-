from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobViewSet,
    ApplicationViewSet,
    RegisterView,
    LoginView,
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet)
router.register(r'applications', ApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
]
