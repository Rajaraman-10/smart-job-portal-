def normalize_application_status(status):
    if not status:
        return status
    normalized = str(status).strip()
    legacy_map = {
        'Pending': 'APPLIED',
        'Viewed': 'RECRUITER_VIEWED',
        'Approved': 'SELECTED',
        'Rejected': 'REJECTED',
    }
    return legacy_map.get(normalized, normalized)


def to_display_application_status(status):
    display_map = {
        'APPLIED': 'Pending',
        'RECRUITER_VIEWED': 'Viewed',
        'SELECTED': 'Approved',
        'REJECTED': 'Rejected',
        'RESUME_SHORTLISTED': 'Resume Shortlisted',
        'RESUME_REJECTED': 'Resume Rejected',
        'QUIZ_SCHEDULED': 'Quiz Scheduled',
        'QUIZ_COMPLETED': 'Quiz Completed',
        'QUIZ_PASSED': 'Quiz Passed / Technical Interview Shortlisted',
        'QUIZ_NOT_CLEARED': 'Quiz Not Cleared',
        'TECHNICAL_INTERVIEW_COMPLETED': 'Technical Interview Completed',
        'TECHNICAL_INTERVIEW_PASSED': 'Technical Interview Passed',
        'TECHNICAL_INTERVIEW_NOT_CLEARED': 'Technical Interview Not Cleared',
        'ON_HOLD': 'On Hold',
    }
    return display_map.get(status, status)
