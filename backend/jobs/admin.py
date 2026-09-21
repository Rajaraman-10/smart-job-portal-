from django.contrib import admin
from .models import Job, Application, Bookmark, Interview, InterviewFeedback, Notification, Company, RecruiterProfile, UserProfile, TechnicalQuiz, OfferLetter, Reminder, SubscriptionPlan, Subscription, PaymentTransaction

admin.site.register(Job)
admin.site.register(Application)
admin.site.register(Bookmark)
admin.site.register(Interview)
admin.site.register(Notification)
admin.site.register(Company)
admin.site.register(RecruiterProfile)
admin.site.register(UserProfile)
admin.site.register(TechnicalQuiz)
admin.site.register(OfferLetter)
admin.site.register(InterviewFeedback)
admin.site.register(Reminder)
admin.site.register(SubscriptionPlan)
admin.site.register(Subscription)
admin.site.register(PaymentTransaction)
