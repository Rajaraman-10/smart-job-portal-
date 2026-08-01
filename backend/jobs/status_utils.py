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
    }
    return display_map.get(status, status)
