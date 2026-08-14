# Smart Job Portal

A full-stack job portal that connects **job seekers**, **recruiters**, and **admins** on one platform. Job seekers discover and apply to jobs, recruiters post openings and manage applicants end-to-end, and admins moderate the platform — with AI-assisted resume screening, live video interviews, and real-time messaging along the way.

## Description

Smart Job Portal is a Django + React application built around three roles:

- **Job Seekers** — browse/search/filter jobs, apply with a resume (text or PDF), bookmark listings, track application status, message recruiters, join video interviews, and receive notifications.
- **Recruiters** — post and manage jobs, review applications, shortlist/reject/schedule interviews, message candidates, view hiring analytics, and manage a company profile.
- **Admins** — oversee users, companies, and applications platform-wide from a dedicated admin dashboard.

### Admin panel

Any account with `user_type=admin` at registration gets routed to `/admin/*` (`AdminLayout`) instead of the recruiter/job-seeker UI, gated server-side by an `is_admin()` check on every admin API call. It's a read-only oversight console:

- **Dashboard** (`/admin/dashboard`) — platform totals (users by role, jobs, active jobs, applications, companies), an application-status breakdown, and the 5 most recent applications/jobs/users.
- **Users** (`/admin/users`) — table of all registered users with name, email, role, and company.
- **Companies** (`/admin/companies`) — table of all company profiles with industry, location, size, and rating.
- **Applications** (`/admin/applications`) — every application platform-wide (applicant, job, company, status, submitted date) with a "View" action to drill into one.

All of this is served by a single `AdminDashboardView` plus the shared `users`/`companies`/`applications` viewsets on the backend (`backend/jobs/views.py`) — there's no separate moderation/edit/delete tooling yet, just visibility across the platform.

Key features:
- JWT-based authentication with email/password, Google Sign-In, and OTP (email/SMS) login
- AI-powered resume screening/match scoring (skills extraction from PDF/DOCX resumes, match score against job requirements)
- Live video interviews via Jitsi Meet, embedded directly in the app
- In-app messaging between recruiters and applicants per application
- Notifications, bookmarks, multi-resume management, and recruiter analytics dashboards
- Deployable to Render/Vercel-style hosts, with AWS S3-backed media storage support

## Tech Stack

**Backend**
- [Django](https://www.djangoproject.com/) 4.2 + [Django REST Framework](https://www.django-rest-framework.org/) — REST API
- [Simple JWT](https://github.com/jazzband/djangorestframework-simplejwt) — token authentication
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers) — CORS handling
- Database: SQLite (default, local dev) or MySQL (via `mysqlclient`, production-ready)
- [django-storages](https://django-storages.readthedocs.io/) + [boto3](https://boto3.amazonaws.com/) — AWS S3 media storage (optional)
- [whitenoise](https://whitenoise.readthedocs.io/) + [gunicorn](https://gunicorn.org/) — static files & WSGI serving in production
- [Twilio](https://www.twilio.com/) — SMS OTP delivery
- [google-auth](https://google-auth.readthedocs.io/) — Google Sign-In verification
- AI/resume parsing: [scikit-learn](https://scikit-learn.org/), [numpy](https://numpy.org/), [openai](https://pypi.org/project/openai/), [PyPDF2](https://pypi.org/project/PyPDF2/), [pdfplumber](https://pypi.org/project/pdfplumber/), [python-docx](https://python-docx.readthedocs.io/)

**Frontend**
- [React 18](https://react.dev/) (Create React App / `react-scripts`)
- [React Router](https://reactrouter.com/) — routing (job seeker, recruiter, admin, interview room views)
- [Axios](https://axios-http.com/) — API client
- [Tailwind CSS](https://tailwindcss.com/) — styling (alongside plain CSS)
- [Recharts](https://recharts.org/) — analytics charts
- [@jitsi/react-sdk](https://www.npmjs.com/package/@jitsi/react-sdk) — embedded video interviews
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google) — Google Sign-In
- [lucide-react](https://lucide.dev/) — icons

## Tools Used

- [Visual Studio Code](https://code.visualstudio.com/) — primary editor
- [Git](https://git-scm.com/) / GitHub — version control
- Python virtual environment (`venv`) — backend dependency isolation
- npm — frontend package management
- Deployment targets: [Render](https://render.com/) (backend) and [Vercel](https://vercel.com/) (frontend), per the origins configured in `backend/backend/settings.py`

## Project Structure

```
smart job portal/
├── backend/            Django project (REST API)
│   ├── backend/        Settings, root URLs, WSGI
│   └── jobs/            App: models, views, serializers, resume scanner
├── frontend/           React app
│   └── src/
│       ├── recruiter/  Recruiter dashboard, jobs, applications, analytics
│       ├── admin/       Admin dashboard, users, companies, applications
│       └── components/ Shared UI components
└── scripts/            One-off debugging/analysis scripts
```

## How to Run

### Prerequisites
- Python 3.10+
- Node.js + npm
- (Optional) MySQL server, if not using the default SQLite database

### 1. Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in `backend/` for configuration (all optional — sensible defaults are used for local dev):

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
USE_SQLITE=True

# MySQL (only needed if USE_SQLITE=False)
MYSQL_DB=smart_job_portal
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306

# Google Sign-In
GOOGLE_OAUTH_CLIENT_ID=

# Email (defaults to console backend, prints to terminal)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Twilio SMS OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_SEND_SMS=False
```

Run migrations and start the API server:

```powershell
python manage.py migrate
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/api/`.

### 2. Frontend setup

```powershell
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000` and talks to the API base URL configured in `frontend/src/services/api.js`.

### 3. Try it out

1. Register as a job seeker or recruiter (or sign in with Google/OTP).
2. As a recruiter, post a job.
3. As a job seeker, browse jobs and apply with a resume.
4. As the recruiter, review the application, view the AI match score, and shortlist/schedule an interview.
5. Join the scheduled interview from either account to test the video call.

## Notes

- Media (resumes, logos) is stored locally under `backend/media/` by default; configure `django-storages`/`boto3` env vars to use AWS S3 instead.
- See `GOOGLE_OAUTH_SETUP.md` and `TWILIO_SETUP.md` for provider-specific setup instructions.
