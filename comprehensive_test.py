import requests
from datetime import datetime

timestamp = int(datetime.now().timestamp())

# Create Recruiter 1
recruiter1_data = {
    'name': 'Recruiter One',
    'email': f'recruiter1_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'recruiter'
}
response = requests.post('http://localhost:8000/api/auth/register/', json=recruiter1_data)
r1_token = response.json()['access']
r1_id = response.json()['user']['id']

# Create Recruiter 2
recruiter2_data = {
    'name': 'Recruiter Two',
    'email': f'recruiter2_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'recruiter'
}
response = requests.post('http://localhost:8000/api/auth/register/', json=recruiter2_data)
r2_token = response.json()['access']
r2_id = response.json()['user']['id']

# Create Job Seeker 1
seeker1_data = {
    'name': 'Seeker One',
    'email': f'seeker1_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'jobseeker'
}
response = requests.post('http://localhost:8000/api/auth/register/', json=seeker1_data)
s1_token = response.json()['access']
s1_id = response.json()['user']['id']

# Create Job Seeker 2
seeker2_data = {
    'name': 'Seeker Two',
    'email': f'seeker2_{timestamp}@example.com',
    'password': 'pass123',
    'user_type': 'jobseeker'
}
response = requests.post('http://localhost:8000/api/auth/register/', json=seeker2_data)
s2_token = response.json()['access']
s2_id = response.json()['user']['id']

print('✅ Created 2 recruiters and 2 job seekers\n')

# Recruiter 1 posts 2 jobs
headers = {'Authorization': f'Bearer {r1_token}'}
job1 = requests.post('http://localhost:8000/api/jobs/', 
    json={'title': 'Python Dev', 'company': 'Corp A', 'location': 'NYC', 'description': 'Job 1'},
    headers=headers).json()
job2 = requests.post('http://localhost:8000/api/jobs/',
    json={'title': 'Node Dev', 'company': 'Corp A', 'location': 'NYC', 'description': 'Job 2'},
    headers=headers).json()
print(f'✅ Recruiter 1 posted 2 jobs: {job1["id"]}, {job2["id"]}\n')

# Recruiter 2 posts 1 job
headers = {'Authorization': f'Bearer {r2_token}'}
job3 = requests.post('http://localhost:8000/api/jobs/',
    json={'title': 'Java Dev', 'company': 'Corp B', 'location': 'SF', 'description': 'Job 3'},
    headers=headers).json()
print(f'✅ Recruiter 2 posted 1 job: {job3["id"]}\n')

# Seeker 1 applies for jobs 1 and 3
headers = {'Authorization': f'Bearer {s1_token}'}
requests.post('http://localhost:8000/api/applications/',
    json={'job': job1['id']}, headers=headers)
requests.post('http://localhost:8000/api/applications/',
    json={'job': job3['id']}, headers=headers)
print('✅ Seeker 1 applied for jobs 1 and 3\n')

# Seeker 2 applies for job 2
headers = {'Authorization': f'Bearer {s2_token}'}
requests.post('http://localhost:8000/api/applications/',
    json={'job': job2['id']}, headers=headers)
print('✅ Seeker 2 applied for job 2\n')

# Test Recruiter 1 - should see 2 applications (job 1 and 2)
headers = {'Authorization': f'Bearer {r1_token}'}
r1_apps = requests.get('http://localhost:8000/api/applications/', headers=headers).json()
print(f'👁️  Recruiter 1 sees {len(r1_apps)} application(s) - Expected: 2')
for app in r1_apps:
    print(f'     - Job {app["job"]}: {app["applicant_name"]}')

# Test Recruiter 2 - should see 1 application (job 3)
headers = {'Authorization': f'Bearer {r2_token}'}
r2_apps = requests.get('http://localhost:8000/api/applications/', headers=headers).json()
print(f'\n👁️  Recruiter 2 sees {len(r2_apps)} application(s) - Expected: 1')
for app in r2_apps:
    print(f'     - Job {app["job"]}: {app["applicant_name"]}')

# Test Seeker 1 - should see 2 applications
headers = {'Authorization': f'Bearer {s1_token}'}
s1_apps = requests.get('http://localhost:8000/api/applications/', headers=headers).json()
print(f'\n👁️  Seeker 1 sees {len(s1_apps)} application(s) - Expected: 2')
for app in s1_apps:
    print(f'     - Job {app["job"]}: {app["job_title"]}')

# Test Seeker 2 - should see 1 application
headers = {'Authorization': f'Bearer {s2_token}'}
s2_apps = requests.get('http://localhost:8000/api/applications/', headers=headers).json()
print(f'\n👁️  Seeker 2 sees {len(s2_apps)} application(s) - Expected: 1')
for app in s2_apps:
    print(f'     - Job {app["job"]}: {app["job_title"]}')

# Verify results
if len(r1_apps) == 2 and len(r2_apps) == 1 and len(s1_apps) == 2 and len(s2_apps) == 1:
    print('\n' + '='*50)
    print('✅ ROLE-BASED FILTERING IS WORKING CORRECTLY!')
    print('='*50)
else:
    print('\n' + '='*50)
    print('❌ ROLE-BASED FILTERING HAS ISSUES')
    print('='*50)
