from django.contrib import admin
from .models import Job, Application, Bookmark, Interview, Notification, Company, RecruiterProfile, UserProfile

admin.site.register(Job)
admin.site.register(Application)
admin.site.register(Bookmark)
admin.site.register(Interview)
admin.site.register(Notification)
admin.site.register(Company)
admin.site.register(RecruiterProfile)
admin.site.register(UserProfile)
