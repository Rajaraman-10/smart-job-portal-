import requests
from datetime import datetime
import json

timestamp = int(datetime.now().timestamp())

# Create accounts
recruiter_data = {
    'name': 'Recruiter Debug',
    'email': f'recruiter_debug_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'recruiter'
}

response = requests.post('http://localhost:8000/api/auth/register/', json=recruiter_data)
recruiter_user_id = response.json()['user']['id']
recruiter_token = response.json()['access']
print(f'Recruiter created: ID={recruiter_user_id}')

seeker_data = {
    'name': 'Seeker Debug',
    'email': f'seeker_debug_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'jobseeker'
}

response = requests.post('http://localhost:8000/api/auth/register/', json=seeker_data)
seeker_user_id = response.json()['user']['id']
seeker_token = response.json()['access']
print(f'Seeker created: ID={seeker_user_id}')

# Post job
job_data = {
    'title': 'Debug Job',
    'company': 'Debug Corp',
    'location': 'Debug City',
    'description': 'Debug Job'
}

headers = {'Authorization': f'Bearer {recruiter_token}'}
response = requests.post('http://localhost:8000/api/jobs/', json=job_data, headers=headers)
job_obj = response.json()
print(f'Job created: recruiter={job_obj.get("recruiter")}, job_id={job_obj.get("id")}')
job_id = job_obj.get('id')

# Apply for job
headers = {'Authorization': f'Bearer {seeker_token}'}
response = requests.post('http://localhost:8000/api/applications/', json={'job': job_id}, headers=headers)
app_obj = response.json()
print(f'Application created: applicant={app_obj.get("applicant")}, job={app_obj.get("job")}')

# Check recruiter's view
headers = {'Authorization': f'Bearer {recruiter_token}'}
response = requests.get('http://localhost:8000/api/applications/', headers=headers)
recruiter_apps = response.json()
print(f'Recruiter sees: {len(recruiter_apps)} apps')
if not recruiter_apps:
    print('ERROR: Recruiter not seeing applications!')
    print(f'Expected: Application with job__recruiter={recruiter_user_id}')
    print(f'Application has job={job_id}, and job should have recruiter={job_obj.get("recruiter")}')
else:
    print(f'SUCCESS: Application details: {recruiter_apps[0]}')

# Check seeker's view
headers = {'Authorization': f'Bearer {seeker_token}'}
response = requests.get('http://localhost:8000/api/applications/', headers=headers)
seeker_apps = response.json()
print(f'Seeker sees: {len(seeker_apps)} apps')
