# Smart Job Portal: Project Handoff Report

**Report date:** 2026-09-21  
**Purpose:** Give another AI enough context to understand the current project before making changes.

## 1. Executive Summary

Smart Job Portal is a full-stack recruitment platform connecting three user roles:

- **Job seekers:** discover jobs, filter listings, maintain profiles and resumes, apply, complete quizzes, attend interviews, message recruiters, and respond to offers.
- **Recruiters:** create jobs, configure screening and hiring stages, review applications, manage quizzes/interviews/offers, communicate with candidates, and view analytics.
- **Admins:** monitor platform users, companies, jobs, applications, verification status, and moderation history.

The application consists of:

- A **Django 4.2 + Django REST Framework** backend in `backend/`.
- A **React 18 / Create React App** frontend in `frontend/`.
- A SQLite database by default, with MySQL configuration available.
- Local media storage for resumes, profile photos, company logos, and quiz PDFs.
- JWT authentication with email/password as the primary login flow.

The project has evolved significantly beyond the original MVP documentation. The older `PROJECT_SUMMARY.md` describes hardcoded users and no authentication; those statements are outdated and should not be used as the current implementation description.

## 2. Current Source of Truth

When documentation and code disagree, use the following order:

1. Current code in `backend/jobs/`, `backend/backend/`, and `frontend/src/`.
2. Current database migrations, up to migration `0028_quiz_access_tracking`.
3. This report.
4. `README.md` for general setup commands.
5. `PROJECT_SUMMARY.md` only as historical context; several sections are stale.

Primary files:

- Backend settings: `backend/backend/settings.py`
- Backend root URLs: `backend/backend/urls.py`
- Backend API URLs: `backend/jobs/urls.py`
- Models: `backend/jobs/models.py`
- Serializers: `backend/jobs/serializers.py`
- API/business logic: `backend/jobs/views.py`
- Resume extraction/scoring: `backend/jobs/resume_scanner.py`
- Status compatibility: `backend/jobs/status_utils.py`
- Frontend router and global state: `frontend/src/App.js`
- Frontend API client: `frontend/src/services/api.js`
- Job seeker dashboard: `frontend/src/JobPortalDashboard.js`
- Recruiter UI: `frontend/src/recruiter/`
- Admin UI: `frontend/src/admin/`
- Shared login UI: `frontend/src/components/LampLogin.js`

## 3. Architecture

### Backend

Django exposes REST endpoints below `/api/`. Django REST Framework viewsets provide standard list/detail/create/update/delete behavior, with custom API views for authentication, analytics, workflows, quizzes, offers, and admin operations.

The backend uses Django's built-in `User` model. The role is stored in `User.last_name` using the values `jobseeker`, `recruiter`, or `admin`. Related profile records store role-specific data.

The backend also owns:

- Object-level access control.
- Resume file extraction and AI-style matching.
- Application status transitions.
- Email and in-app notification creation.
- Interview room generation.
- Technical quiz scoring and access-token handling.
- Offer state transitions.
- Admin audit logging.

### Frontend

React uses `react-router-dom` for route handling. `App.js` owns authentication restoration, role routing, shared user state, theme state, and several dashboard data-loading flows.

Role-specific layouts are mounted under:

- `/admin/*`
- `/recruiter/*`
- The job-seeker experience is rendered through the main application shell and dashboard flow.
- `/interview/:roomId` renders the interview room.
- Quiz access is handled by the quiz page flow using a token.

The frontend stores authentication state in browser `localStorage` and calls the backend through `frontend/src/services/api.js`. The API client has a shared JWT refresh mechanism, although some direct `fetch` calls in the application bypass it.

## 4. Technology Stack

### Backend dependencies

- Django 4.2
- Django REST Framework
- `djangorestframework-simplejwt`
- `django-cors-headers`
- `python-dotenv`
- `mysqlclient`
- `google-auth`
- `twilio` dependency retained for optional/legacy SMS support
- `PyPDF2`, `pdfplumber`, and `python-docx` for document extraction
- `scikit-learn` and `numpy` for resume matching
- Pillow for image uploads
- `django-storages` and `boto3` dependencies are present for possible S3 support
- WhiteNoise and Gunicorn for deployment

### Frontend dependencies

- React 18.3
- React Router 7
- Axios, although much of the API client uses `fetch`
- Bootstrap and Tailwind CSS tooling
- Recharts for analytics
- `@jitsi/react-sdk` for video interviews
- `@react-oauth/google` for Google Sign-In
- `lucide-react` for icons
- Create React App / `react-scripts`

## 5. Authentication and Sessions

### Primary authentication flow

The current primary flow is email and password:

1. Frontend submits registration to `POST /api/auth/register/`.
2. Frontend submits login credentials to `POST /api/auth/login/`.
3. Backend returns an access JWT, refresh JWT, role, and user object.
4. Frontend stores `accessToken`, `refreshToken`, `userType`, and serialized `user` in `localStorage`.
5. Authenticated API requests send `Authorization: Bearer <access token>`.
6. On a `401`, the shared API wrapper attempts to refresh the access token using the refresh token.
7. If refresh fails, stored session values are cleared and an `auth:session-expired` browser event is dispatched.

JWT configuration:

- Access token lifetime: 2 hours.
- Refresh token lifetime: 7 days.
- Header type: `Bearer`.

### Other authentication-related flows

The backend also exposes:

- Google Sign-In.
- Email OTP request/verification.
- Recruiter email verification OTP.
- Password reset using email/OTP.

There are still both `LoginOTP` and legacy mobile `OTP` models. The normal frontend login flow uses email/password, but the OTP endpoints remain active in the backend/API client and are covered by tests. Do not remove them without checking all consumers and product requirements.

### Role routing

- Job seekers are routed to the main job-seeker dashboard.
- Recruiters are routed to the recruiter layout under `/recruiter/*`.
- Admins are routed to the admin layout under `/admin/*`.
- `ProtectedRoute` guards recruiter and admin route groups on the frontend.
- Backend views also enforce authentication, role, and object ownership.

Important mismatch: the frontend presents an Admin registration option in parts of the UI, but the registration serializer currently accepts only `jobseeker` and `recruiter`. Admin accounts therefore need to be provisioned separately or the registration contract must be changed deliberately.

## 6. Implemented Job-Seeker Features

The job-seeker product includes:

- Browse active job listings.
- Search by job title, company, and location.
- Filter by category, work mode, experience level, minimum salary, and posting age.
- View job details and company information.
- Bookmark/save jobs.
- Submit applications with:
  - Resume text.
  - PDF or supported document upload.
  - Existing saved-resume selection.
  - Cover letter.
  - Declared skills.
- Track application status through the recruitment pipeline.
- View AI match score, matched skills, and missing skills.
- Edit application data where permitted, with resume edit tracking.
- Maintain a profile with personal details, preferences, skills, education, projects, work history, certifications, languages, and social links.
- Upload a profile photo.
- Upload and manage multiple resumes, including a primary resume.
- Receive in-app notifications.
- Message recruiters within the application conversation.
- Open scheduled Jitsi interviews.
- Access a technical quiz through a tokenized link.
- Accept or decline an offer.
- Configure email notification preference.

## 7. Implemented Recruiter Features

Recruiters can:

- View dashboard pipeline metrics.
- Create, edit, close, reopen, and delete jobs.
- Associate jobs with a company.
- Configure title, description, location, salary, category, skills, experience level, and work mode.
- Configure resume screening threshold and recruitment timeline fields.
- Upload a technical-question PDF.
- Parse, preview, edit, and publish quiz questions.
- View applications scoped to their recruiter/company access.
- Mark applications viewed.
- Shortlist, reject, hold, and advance applications.
- Schedule, reschedule, cancel, and complete interviews.
- Use Jitsi-based video interview rooms.
- Send and receive candidate messages.
- Send or manage technical quiz stages.
- Create and send offer letters with salary, joining date, terms, and response state.
- Manage company information and logo.
- Maintain recruiter profile details and verification flags.
- View analytics including jobs, application totals, interviews, applications per day, top jobs, top skills, and job share.
- Trigger workflow notifications and email updates.

The recruiter subscription route exists in the frontend, but billing and plan management are currently a placeholder rather than a complete payment system.

## 8. Implemented Admin Features

Admin routes are protected on both frontend and backend. The admin area includes:

- Platform dashboard with totals by role, jobs, active jobs, applications, and companies.
- Application status breakdown.
- Recent applications, jobs, and users.
- User listing with role, email, name, and company information.
- User activation/suspension controls.
- Company listing and verification review.
- Company logo and profile moderation.
- Platform-wide application listing and status updates.
- Job close, reopen, and delete controls.
- Audit log of moderation actions.
- Platform-wide analytics.

The README describes the admin panel as read-only, but the current implementation supports moderation and status-changing actions. The code is the authoritative behavior.

## 9. Application Workflow

The intended end-to-end workflow is:

1. Recruiter creates a job.
2. Job seeker applies with profile/resume data.
3. Backend extracts resume text when a supported file is supplied.
4. Backend calculates an AI-style match score against the job.
5. Applications below the configured screening threshold can become `RESUME_REJECTED`.
6. Passing applications can become `RESUME_SHORTLISTED` or `SHORTLISTED`.
7. Recruiter can publish or schedule a technical quiz.
8. Candidate opens the tokenized quiz link during the configured window.
9. Candidate submits answers.
10. Backend calculates the quiz score and sets `QUIZ_PASSED` or `QUIZ_NOT_CLEARED`.
11. Recruiter schedules an interview after the required quiz conditions are met.
12. Interview uses a generated Jitsi room/meeting URL.
13. Recruiter selects the candidate and creates an offer.
14. Candidate accepts or declines the offer.
15. Accepted offer can transition the application to `JOINED`.

Application status codes include:

`APPLIED`, `RECRUITER_VIEWED`, `SHORTLISTED`, `RESUME_SHORTLISTED`, `RESUME_REJECTED`, `QUIZ_SCHEDULED`, `QUIZ_COMPLETED`, `QUIZ_PASSED`, `QUIZ_NOT_CLEARED`, `INTERVIEW_SCHEDULED`, `INTERVIEW_COMPLETED`, `TECHNICAL_INTERVIEW_COMPLETED`, `TECHNICAL_INTERVIEW_PASSED`, `TECHNICAL_INTERVIEW_NOT_CLEARED`, `SELECTED`, `REJECTED`, `ON_HOLD`, `OFFER_SENT`, and `JOINED`.

`backend/jobs/status_utils.py` exists to normalize legacy status values such as `Pending`, `Approved`, and `Rejected` to canonical status codes.

## 10. Resume Matching

Resume processing is implemented locally rather than relying on a visible external OpenAI call.

The matching path uses:

- Required-skill extraction/comparison.
- A required-skill component weighted at approximately 70%.
- TF-IDF text similarity weighted at approximately 30%.
- Extracted matched-skill and missing-skill lists.
- Stored score and scan timestamp on the application.

Supported extraction libraries include PDF parsers and `python-docx`. Scanning currently occurs synchronously during application creation, so large or malformed files may increase request latency.

## 11. Backend Models

Defined in `backend/jobs/models.py`:

- `LoginOTP`: email OTP value, timestamp, expiry behavior, and used state.
- `OTP`: legacy mobile OTP record.
- `Job`: recruiter, company, listing fields, salary, filters, screening configuration, recruitment timeline, quiz PDF/questions, and status.
- `Application`: applicant, job, applicant contact data, resume text/file, cover letter, skills, AI results, viewed state, edit count, timestamps, and status.
- `Company`: company identity, logo, website, industry, size, description, location, rating, registration details, and verification/review fields.
- `RecruiterProfile`: recruiter/company relationship, contact information, profile photo, and verification flags.
- `UserProfile`: job-seeker profile, preferences, structured resume data, profile photo, email notification setting, completion state, and subscription placeholder.
- `Resume`: multiple uploaded resumes with labels and primary-resume flag.
- `Bookmark`: unique user/job saved listing relation.
- `Conversation`: one conversation per application linking candidate and recruiter.
- `Message`: conversation message with sender, sender type, read state, and timestamp.
- `Interview`: application, recruiter, candidate, date/time, Jitsi/meeting data, mode, notes, and status.
- `TechnicalQuiz`: per-application questions, answers, passing score, score, status, access token, email state, and timing fields.
- `OfferLetter`: per-application offer with recruiter, salary, joining date, terms, and response state.
- `Notification`: user notification with type, link, read state, and timestamp.
- `AdminAuditLog`: admin action, target, details, and timestamp.

Migrations currently reach `0028_quiz_access_tracking`.

## 12. API Surface

API base prefix: `/api/`.

### Router resources

- `/api/jobs/`
- `/api/applications/`
- `/api/conversations/`
- `/api/messages/`
- `/api/bookmarks/`
- `/api/resumes/`
- `/api/interviews/`
- `/api/notifications/`
- `/api/users/`
- `/api/companies/`

### Authentication and profiles

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/google-login/`
- `GET/PATCH /api/auth/profile/`
- `GET/PATCH /api/auth/recruiter-profile/`
- `POST /api/auth/verify-recruiter-email/`
- `POST /api/auth/request-otp/`
- `POST /api/auth/verify-otp/`
- `POST /api/auth/request-password-reset/`
- `POST /api/auth/reset-password/`

### Specialized endpoints

- `GET /api/analytics/`
- `GET /api/admin/dashboard/`
- `GET /api/admin/audit-log/`
- `GET /api/applications/grouped-by-job/`
- `GET/PUT/POST /api/applications/{id}/workflow/`
- `PUT/POST /api/applications/{id}/offer/`
- `GET/POST/PUT /api/jobs/{id}/quiz-question-set/`
- `POST /api/jobs/quiz-question-set/preview/`
- `GET/POST /api/quiz/access/{token}/`
- `POST /api/applications/{id}/quiz/resend/`
- `/api/resumes/{id}/set_primary/`
- `/api/notifications/{id}/mark-read/`
- `/api/conversations/unread-count/`
- `/api/messages/mark-all-read/`
- `/api/messages/{id}/mark-read/`
- `/api/users/{id}/toggle-active/`
- `/api/companies/{id}/logo/`
- `/api/companies/{id}/verification/`

Check `backend/jobs/urls.py` and the viewsets before assuming all standard CRUD methods are available for every resource. Several methods have role-specific querysets and permissions.

## 13. Frontend Routes and Main Surfaces

The main routing/state owner is `frontend/src/App.js`.

Important route groups include:

- `/admin/*`: admin layout and pages.
- `/admin/dashboard`: platform dashboard.
- `/admin/users`: user management.
- `/admin/companies`: company review.
- `/admin/applications`: application review.
- `/admin/jobs`: job moderation.
- `/admin/audit-log`: moderation history.
- `/recruiter/*`: recruiter layout and dashboard pages.
- `/recruiter/dashboard`: recruiter overview.
- Recruiter job, application, analytics, company, settings, interview, and subscription surfaces.
- `/interview/:roomId`: Jitsi interview room.
- Quiz pages use `/quiz/:token` in links generated by the backend/frontend workflow.

The job-seeker flow is heavily composed inside `App.js` and `JobPortalDashboard.js`, rather than being isolated into one route tree equivalent to the recruiter/admin layouts.

## 14. Configuration and Running Locally

### Backend

Requirements: Python 3.10+.

```powershell
cd "d:\smart job portal\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000/`; API base is `http://127.0.0.1:8000/api/`.

### Frontend

```powershell
cd "d:\smart job portal\frontend"
npm.cmd install
npm.cmd start
```

Frontend runs at `http://localhost:3000`.

On Windows PowerShell, use `npm.cmd` as the workspace tasks do.

### Important environment variables

Backend:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `USE_SQLITE`
- `MYSQL_DB`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`
- `GOOGLE_OAUTH_CLIENT_ID`
- `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_SEND_SMS`

Frontend:

- `REACT_APP_API_BASE_URL`
- `REACT_APP_GOOGLE_CLIENT_ID`

If `REACT_APP_API_BASE_URL` is absent, local hostnames use `http://127.0.0.1:8000/api`; other hosts default to the Render URL `https://smart-job-portal-2jkd.onrender.com/api`.

## 15. Storage, Email, and External Integrations

### Email

Development defaults to Django's console email backend. Workflow emails include application status changes, interview notifications, quiz results/invitations, recruiter verification, and offer-related messages. Several workflow email calls use best-effort behavior and may fail silently.

### Google OAuth

Backend verification uses `google-auth`. The React frontend uses `@react-oauth/google`. Client IDs must be configured consistently on both sides.

### Jitsi

Interviews use the Jitsi React SDK and the public `https://meet.jit.si` service. The project stores meeting URL/room data on `Interview`.

### Resume/document parsing

PDF and DOCX parsing is supported through the installed parsing libraries. Uploaded media is stored under `backend/media/` by default.

### AWS S3

`boto3` and `django-storages` are installed, but the inspected settings still use local `MEDIA_ROOT`. Do not assume S3 is active without adding/verifying the storage configuration.

### Twilio

Twilio settings and the package remain, but the active OTP behavior is email-based. Do not assume SMS delivery is configured or used.

## 16. Testing and Existing Verification

Automated Django tests are in `backend/jobs/tests.py`. They cover areas including:

- Recruiter/company job visibility.
- Case-insensitive login.
- Duplicate email rejection.
- Registration behavior.
- Application viewed transitions.
- Interview creation and Jitsi room generation.
- Message creation.
- OTP behavior.
- Status-change email behavior.
- Quiz and offer workflow.

Standalone scripts include:

- `comprehensive_test.py`: broader local registration, posting, application, and role-filtering flow.
- `test_role_filtering.py`: role-scoping checks.
- `test_deployment.py`: repeated checks against the Render registration endpoint.
- `debug_filtering.py`: local filtering diagnostics.
- `scripts/`: one-off parsing and debugging utilities.

A compiled frontend build exists under `frontend/build/`. Prior repository notes report successful frontend compilation and end-to-end email/password registration/login verification, but a fresh full test/build run should be performed before relying on those claims.

Suggested validation commands:

```powershell
cd "d:\smart job portal\backend"
python manage.py check
python manage.py test
```

```powershell
cd "d:\smart job portal\frontend"
npm.cmd run build
```

## 17. Deployment State

The repository is prepared for a Render-style backend and Vercel-style frontend deployment:

- Backend deployment origin is referenced in settings and test scripts.
- Frontend fallback API URL points to the Render backend.
- A compiled frontend build is present.
- Gunicorn and WhiteNoise are included in backend dependencies.

However, no `render.yaml`, `vercel.json`, Dockerfile, or CI deployment workflow was found in the workspace. Repository artifacts alone therefore do not prove that production is currently deployed or healthy.

## 18. Known Limitations and Risks

1. **Admin registration mismatch:** normal registration does not accept the admin role even though parts of the frontend expose an Admin option.
2. **Stale documentation:** `PROJECT_SUMMARY.md` claims authentication and admin tooling are not implemented; that is false for the current code.
3. **OTP documentation conflict:** some documents say OTP was removed, while email OTP endpoints, client helpers, tests, and models remain.
4. **Twilio mismatch:** SMS settings/documentation exist, but the active flow is not visibly sending SMS.
5. **Quiz invitation email needs verification:** `send_quiz_email()` has a suspicious control-flow shape in `views.py`; verify actual email delivery before treating the invitation stage as complete.
6. **Synchronous resume scanning:** application creation can be slow for large or difficult files.
7. **Direct fetch calls:** some frontend requests bypass the shared refresh wrapper, so expired-token handling is not uniform.
8. **Development-oriented security defaults:** default secret key, `DEBUG=True`, wildcard `ALLOWED_HOSTS`, and `CORS_ALLOW_ALL_ORIGINS=True` are unsafe unless production environment/configuration overrides them.
9. **Local storage by default:** media remains on the local filesystem unless storage configuration is added.
10. **Email delivery is best effort:** failed email sending may not fail the API request, so the UI/database may indicate progress even when an email was not delivered.
11. **Subscription is incomplete:** the recruiter subscription screen is a placeholder and does not represent a billing integration.
12. **Route fallback should be checked:** `ProtectedRoute` references `/login`, while authentication display is primarily controlled by `showAuth` in `App.js`; verify unauthenticated deep-link behavior.
13. **Role data convention:** role is stored in `User.last_name`, which is unconventional and must be preserved or migrated carefully.
14. **CORS is overly broad:** explicit allowed origins are present, but `CORS_ALLOW_ALL_ORIGINS=True` overrides the intended restriction.

## 19. Recommended Next-AI Workflow

Before changing behavior:

1. Read this report and the relevant current source file.
2. Check the database model and serializer contract before changing frontend payloads.
3. Check role/object permissions in `views.py`, not only frontend route guards.
4. Preserve canonical uppercase application status codes unless doing a deliberate migration.
5. Reuse `apiFetch` or extend it when adding authenticated frontend calls.
6. Update tests for any workflow, permission, serializer, or authentication change.
7. Run the narrowest relevant Django test first, then `python manage.py check` and the frontend build if the change crosses stacks.
8. Treat `PROJECT_SUMMARY.md`, old OTP/Twilio docs, and deployment claims as historical unless confirmed in code/configuration.

## 20. Short Handoff Prompt

Use the following prompt when giving the project to another AI:

> You are working on the Smart Job Portal in `d:\smart job portal`. Read `PROJECT_HANDOFF_REPORT.md` first. This is a Django REST Framework backend plus React 18 frontend. The current primary authentication flow is email/password JWT with jobseeker, recruiter, and admin roles. The backend owns role/object permissions, resume parsing and matching, application workflows, technical quizzes, Jitsi interviews, messaging, offers, notifications, company verification, and admin audit logging. Do not trust the old claims in `PROJECT_SUMMARY.md` that authentication/admin are missing. Before editing, inspect the relevant model, serializer, view, URL, and frontend API caller; keep changes focused; preserve current status codes and role boundaries; and run focused tests/build validation after edits.

## 21. Advanced Features Added

The following advanced feature foundation is now implemented in the current codebase:

1. **Resume ranking:** `GET /api/applications/?ordering=-ai_match_score` ranks recruiter-visible applications by the existing AI match score.
2. **Candidate comparison:** `GET /api/applications/compare/?ids=1,2,3` returns up to six access-controlled applications for side-by-side comparison.
3. **Advanced recruiter filters:** application queries support `search`, `job`, `status`, `min_score`, `max_score`, `skills`, `experience_level`, `work_mode`, `applied_after`, `applied_before`, and `has_interview`.
4. **Interview feedback:** structured ratings, recommendation, strengths, concerns, and notes are stored in `InterviewFeedback` and submitted through `/api/interviews/{id}/feedback/`. The recruiter interview page includes a feedback form.
5. **Automated reminders:** interviews create 24-hour and 1-hour `Reminder` records. The `python manage.py send_due_reminders` command delivers due email and in-app reminders. A host scheduler/cron job must invoke this command periodically for continuous automation.
6. **Candidate search:** the recruiter applications page has search and advanced filter controls, backed by server-side query parameters.
7. **Job recommendations:** `GET /api/jobs/recommended/` scores active jobs against the job-seeker profile skills and preferences. `fetchRecommendedJobs()` is available in the frontend API client for integrating it into the dashboard.
8. **Reports/export:** `GET /api/analytics/export/` returns a recruiter/admin CSV application report; the recruiter analytics page includes an export control.
9. **Subscription/payment foundation:** `SubscriptionPlan`, `Subscription`, and `PaymentTransaction` models provide plan, entitlement, transaction, and idempotency state. Recruiters can view plans and create an idempotent checkout transaction from `/recruiter/subscription`. A real provider must call `/api/payments/webhook/` to confirm payment before a subscription becomes active.

### Advanced feature files

- Models and migration: `backend/jobs/models.py`, `backend/jobs/migrations/0029_subscriptionplan_alter_application_status_and_more.py`
- API views and filtering: `backend/jobs/views.py`
- API routes: `backend/jobs/urls.py`
- Serializer contracts: `backend/jobs/serializers.py`
- Reminder scheduler command: `backend/jobs/management/commands/send_due_reminders.py`
- Recruiter comparison/filter UI: `frontend/src/recruiter/pages/RecruiterApplicationsPage.js`
- Interview feedback UI: `frontend/src/recruiter/pages/RecruiterInterviewsPage.js`
- Analytics export UI: `frontend/src/recruiter/pages/RecruiterAnalyticsPage.js`
- Subscription UI: `frontend/src/recruiter/pages/RecruiterSubscriptionPage.js`
- Frontend API clients: `frontend/src/services/api.js`

### Payment boundary

The subscription work is intentionally provider-neutral. It does not claim that card checkout, provider signatures, refunds, invoices, or recurring billing are complete. To go live, configure a provider such as Stripe or Razorpay, verify webhook signatures, map provider events idempotently, and replace the current checkout transaction message with the provider checkout URL.
