# Smart Job Portal

A full-stack job portal built with Django, React, MySQL, and AWS.

## Overview

- **Backend:** Django REST Framework
- **Frontend:** React.js
- **Database:** MySQL
- **Hosting:** AWS-ready deployment

## Structure

- `backend/` - Django project and REST API
- `frontend/` - React application

## Setup

### Backend

1. Create a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Configure MySQL credentials in `backend/backend/settings.py` or with environment variables:
   - `MYSQL_DB`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_HOST`
   - `MYSQL_PORT`
4. Run migrations:
   ```powershell
   python backend/manage.py migrate
   ```
5. Start the API server:
   ```powershell
   python backend/manage.py runserver
   ```

### Frontend

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the React development server:
   ```powershell
   npm start
   ```

## Notes

- API base URL is configured in `frontend/src/services/api.js`.
- AWS deployment can use Elastic Beanstalk, ECS, or Amplify for frontend and backend hosting.
