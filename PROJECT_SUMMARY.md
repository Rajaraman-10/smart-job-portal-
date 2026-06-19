# Smart Job Portal - Project Summary

## Project Overview
A full-stack web application that connects **Job Seekers** with **Recruiters**. Job seekers can browse and apply to jobs; recruiters can post jobs and manage applications with email notifications.

**Tech Stack:**
- Frontend: React (CRA-like setup)
- Backend: Django REST Framework
- Database: SQLite (fallback from MySQL)
- Server: Django development server on port 8000, React on port 3000

---

## Architecture

### Backend Structure
```
backend/
├── backend/
│   ├── settings.py       # Django config, email settings, CORS, media config
│   ├── urls.py           # Routes to /api/ endpoints
│   └── wsgi.py
├── jobs/
│   ├── models.py         # Job, Application models
│   ├── serializers.py    # REST serializers
│   ├── views.py          # API ViewSets with email logic
│   ├── urls.py           # Router for jobs and applications
│   └── migrations/       # 0001-0005 (latest adds salary field)
├── manage.py
└── db.sqlite3            # SQLite database

```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.js            # Main component with job seeker & recruiter UI
│   ├── App.css           # All styles (responsive, card-based design)
│   ├── services/
│   │   └── api.js        # API client functions (fetch, create, update)
│   └── index.js
├── package.json
└── public/

```

---

## Features Implemented

### 1. **Job Seeker View**
- Browse all posted jobs with search and category filtering
- Job cards display: title, company, location, salary (💰), description preview
- Apply modal with:
  - Name input (required)
  - Email input (required)
  - Resume: text input OR PDF file upload
  - Cover letter: text input
- Success/error messages for application submission

### 2. **Recruiter View**
- Two tabs: "Post Job" | "Applications"

**Post Job Tab:**
- Form to post new jobs with:
  - Job Title
  - Company Name
  - Location
  - Salary (e.g., "$80K-$120K/year")
  - Job Description
- Auto-associates job with recruiter1 user

**Applications Tab:**
- Dashboard showing all applications grouped by job
- For each job: title, company, location, salary, applicant count
- For each applicant: 
  - Name, email, status (Pending/Approved/Rejected)
  - Resume: text preview or PDF download link
  - Cover letter preview
  - **Approve/Reject buttons** (only for Pending status)
- Approve button sends interview notification email to applicant

### 3. **Email Notifications**
- When recruiter approves an application:
  - Applicant receives email: "You are selected for interview - [Job Title] at [Company]"
  - Email uses Django's email backend (console in dev, SMTP configurable)

### 4. **File Upload Support**
- PDF resume uploads stored in `backend/media/resumes/`
- MEDIA_URL and MEDIA_ROOT configured
- Django serves files in debug mode via static file middleware

---

## Database Models

### Job
| Field | Type | Notes |
|-------|------|-------|
| id | AutoField | Primary key |
| recruiter | ForeignKey(User) | Links to recruiter |
| title | CharField(255) | Job title |
| company | CharField(255) | Company name |
| location | CharField(255) | Job location |
| salary | CharField(100) | e.g., "$50K-$70K", optional |
| description | TextField | Job details |
| posted_at | DateTimeField | Auto-created timestamp |

### Application
| Field | Type | Notes |
|-------|------|-------|
| id | AutoField | Primary key |
| job | ForeignKey(Job) | Linked job |
| applicant | ForeignKey(User) | Applicant user (auto-created as 'applicant1') |
| applicant_name | CharField(255) | Applicant's display name |
| applicant_email | EmailField | Applicant's email for notifications |
| resume | TextField | Text resume (optional) |
| resume_file | FileField | PDF upload (optional) |
| cover_letter | TextField | Cover letter text |
| applied_at | DateTimeField | Application timestamp |
| status | CharField(50) | 'Pending', 'Approved', 'Rejected' |

---

## API Endpoints

All endpoints at `http://127.0.0.1:8000/api/`

### Jobs
- `GET /api/jobs/` - List all jobs
- `POST /api/jobs/` - Create job (requires `title`, `company`, `location`, `description`, `salary` optional)
- `PATCH /api/jobs/{id}/` - Update job

### Applications
- `GET /api/applications/` - List all applications
- `POST /api/applications/` - Submit application
  - Supports JSON: `{job, applicant, applicant_name, applicant_email, resume, cover_letter, status}`
  - Supports FormData: `job, applicant, applicant_name, applicant_email, resume_file, cover_letter, status`
- `PATCH /api/applications/{id}/` - Update application status → triggers email if status→"Approved"

**Permissions:** AllowAny (no authentication required for MVP)

---

## Frontend Components & Routing

### Main Navigation
- Two main modes: **Job Seeker** | **Post Job** (Recruiter)
- Toggle via navbar buttons

### Job Seeker Mode
1. Hero section with search box
2. Category filter buttons (All, IT, Development, Design, Marketing, Sales)
3. Job grid with cards
4. Apply modal overlay

### Recruiter Mode
1. Page switcher: Post Job | Applications
2. **Post Job**: Form to create job with salary
3. **Applications**: Dashboard grouped by job with approve/reject actions

---

## Migrations Applied

```
1. 0001_initial.py          → Job & Application models
2. 0002_application_resume_file.py → resume_file FileField
3. 0003_application_applicant_name.py → applicant_name CharField
4. 0004_application_applicant_email.py → applicant_email EmailField
5. 0005_job_salary.py       → salary CharField on Job
```

---

## Configuration Files

### Backend Settings
- `DEBUG = True` (from .env or default)
- `ALLOWED_HOSTS = localhost, 127.0.0.1`
- `DATABASES = SQLite` (USE_SQLITE=True default)
- `CORS_ALLOWED_ORIGINS = localhost:3000, 127.0.0.1:3000`
- `DEFAULT_AUTO_FIELD = BigAutoField`
- `EMAIL_BACKEND = django.core.mail.backends.console.EmailBackend` (dev mode prints to console)

### Frontend
- `API_BASE_URL = http://127.0.0.1:8000/api` (from env or default)
- Uses React hooks (useState, useEffect)
- Form validation on frontend

---

## How to Run

### Backend Setup
```powershell
cd d:\smart job portal\backend

# Apply migrations (if fresh setup)
python manage.py migrate

# Create sample recruiter/applicant users (optional)
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.get_or_create(username='recruiter1')
>>> User.objects.get_or_create(username='applicant1')

# Start Django server
python manage.py runserver
```

### Frontend Setup
```powershell
cd d:\smart job portal\frontend

# Install dependencies (if fresh setup)
npm.cmd install

# Start React dev server
npm.cmd start
```

**Access:** http://localhost:3000

---

## Current Status ✅

### Completed
- ✅ Job posting by recruiters
- ✅ Job search/browse by seekers
- ✅ Application submission with name, email, resume (text/PDF), cover letter
- ✅ Recruiter dashboard showing all applications grouped by job
- ✅ Approve/Reject buttons for pending applications
- ✅ Email notification when approved for interview
- ✅ Salary field display on jobs
- ✅ Responsive UI with modern card-based design
- ✅ File upload handling (PDF resumes)
- ✅ Status badges (Pending/Approved/Rejected)
- ✅ Error messages with actual backend error details

### Not Yet Implemented (Future Work)
- ❌ User authentication (currently uses hardcoded user IDs)
- ❌ Persistent user sessions/login system
- ❌ Job seeker dashboard (view my applications)
- ❌ Recruiter job management (edit/delete jobs)
- ❌ Application filtering by status
- ❌ Real email sending (Gmail SMTP config needed)
- ❌ Job categories backend filtering
- ❌ Experience/skills tracking
- ❌ Job bookmarking/favorites
- ❌ Interview scheduling
- ❌ Mobile app
- ❌ Admin panel for moderation

---

## Important Notes for Continuation

### User Model Workaround
Currently, the system auto-creates:
- Recruiter: `recruiter1` user (from settings)
- Applicant: `applicant1` user (from settings)

**TODO:** Implement proper authentication so:
- Each recruiter can only see their own posted jobs
- Each applicant can see/manage their own applications
- Real email addresses are used (not just stored in db)

### Email Configuration
For production, update `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Windows Node/npm Issues
Always use `npm.cmd` on Windows PowerShell (not `npm`):
```powershell
npm.cmd install
npm.cmd start
```

---

## Key File Paths

**Backend:**
- Models: `d:\smart job portal\backend\jobs\models.py`
- Views/API: `d:\smart job portal\backend\jobs\views.py`
- Serializers: `d:\smart job portal\backend\jobs\serializers.py`
- Settings: `d:\smart job portal\backend\backend\settings.py`
- Database: `d:\smart job portal\backend\db.sqlite3`

**Frontend:**
- Main App: `d:\smart job portal\frontend\src\App.js`
- Styles: `d:\smart job portal\frontend\src\App.css`
- API Client: `d:\smart job portal\frontend\src\services\api.js`
- Package.json: `d:\smart job portal\frontend\package.json`

---

## Resuming Work Checklist

If starting fresh on new account:
1. ✅ Clone/sync project files
2. ✅ `cd backend && python manage.py migrate`
3. ✅ `cd ../frontend && npm.cmd install`
4. ✅ Start backend: `python manage.py runserver`
5. ✅ Start frontend: `npm.cmd start`
6. ✅ Test in browser: http://localhost:3000
7. ✅ Try posting job as recruiter
8. ✅ Try applying as job seeker
9. ✅ Test approve button → check Django console for email output

---

## Testing Workflow

**Quick Test:**
1. Open http://localhost:3000
2. Click "Post Job" (Recruiter)
3. Fill form: Title=Python Dev, Company=TechCorp, Location=NYC, Salary=$100K, Description=Test
4. Submit → should see success
5. Click "Job Seeker"
6. See job in list → click "Apply Now"
7. Fill: Name=John, Email=john@example.com, Resume text or PDF, Cover=I'm interested
8. Submit → should see success
9. Click "Post Job" → "Applications" tab
10. See John's application, click Approve
11. Check Django terminal → should see email output

