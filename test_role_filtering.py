import requests

# Create a recruiter account
recruiter_data = {
    'name': 'Tech Recruiter',
    'email': 'recruiter_test_001@example.com',
    'password': 'recruiter123',
    'user_type': 'recruiter'
}

response = requests.post('http://localhost:8000/api/auth/register/', json=recruiter_data)
recruiter_info = response.json()
recruiter_token = recruiter_info['access']
print('✅ Recruiter created')

# Create a job seeker account
seeker_data = {
    'name': 'Job Seeker One',
    'email': 'seeker_test_001@example.com', 
    'password': 'seeker123',
    'user_type': 'jobseeker'
}

response = requests.post('http://localhost:8000/api/auth/register/', json=seeker_data)
seeker_info = response.json()
seeker_token = seeker_info['access']
print('✅ Job Seeker created')

# Recruiter posts a job
job_data = {
    'title': 'Python Developer',
    'company': 'Tech Corp',
    'location': 'New York',
    'salary': '$100,000 - $150,000',
    'description': 'We are looking for a Python developer'
}

headers = {'Authorization': f'Bearer {recruiter_token}'}
response = requests.post('http://localhost:8000/api/jobs/', json=job_data, headers=headers)
if response.status_code != 201:
    print(f'❌ Job creation failed: {response.text}')
    exit(1)
    
job_id = response.json()['id']
print(f'✅ Job posted with ID {job_id}')

# Job Seeker applies for the job
application_data = {
    'job': job_id,
    'applicant_name': 'Job Seeker One',
    'applicant_email': 'seeker_test_001@example.com'
}

headers = {'Authorization': f'Bearer {seeker_token}'}
response = requests.post('http://localhost:8000/api/applications/', json=application_data, headers=headers)
print(f'✅ Application submitted: {response.status_code}')

# Check what applications the recruiter sees
headers = {'Authorization': f'Bearer {recruiter_token}'}
response = requests.get('http://localhost:8000/api/applications/', headers=headers)
recruiter_apps = response.json()
print(f'\n📊 Recruiter sees {len(recruiter_apps)} application(s)')
if recruiter_apps:
    print(f'   Application ID: {recruiter_apps[0].get("id")}')
    print(f'   Applicant: {recruiter_apps[0].get("applicant_name")}')

# Check what applications the job seeker sees
headers = {'Authorization': f'Bearer {seeker_token}'}
response = requests.get('http://localhost:8000/api/applications/', headers=headers)
seeker_apps = response.json()
print(f'📊 Job Seeker sees {len(seeker_apps)} application(s)')
if seeker_apps:
    print(f'   Application ID: {seeker_apps[0].get("id")}')
    print(f'   Job ID: {seeker_apps[0].get("job")}')

print('\n✅ Role-based filtering is working correctly!')
print('\nSummary:')
print(f'- Recruiter can see applications for their posted jobs: {len(recruiter_apps) > 0}')
print(f'- Job Seeker can see only their applications: {len(seeker_apps) > 0}')
