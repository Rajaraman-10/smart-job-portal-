import requests
import time
import json

print('Testing production endpoints...')
print('=' * 60)

max_attempts = 10
attempt = 0
deployed = False

while attempt < max_attempts and not deployed:
    attempt += 1
    timestamp = time.strftime('%H:%M:%S')
    print(f'\n[Attempt {attempt}/{max_attempts}] Testing at {timestamp}')
    
    try:
        data = {
            'name': 'Test User',
            'email': f'test{int(time.time())}@example.com',
            'password': 'testpass123',
            'user_type': 'jobseeker'
        }
        
        response = requests.post(
            'https://smart-job-portal-2jkd.onrender.com/api/auth/register/', 
            json=data, 
            timeout=5
        )
        
        if response.status_code == 201:
            print('✅ DEPLOYED! Register endpoint is live!')
            result = response.json()
            print(f"User created: {result['user']['email']}")
            deployed = True
        elif response.status_code == 404:
            print('⏳ Still deploying (404 - endpoint not found yet)...')
        else:
            print(f'Status: {response.status_code}')
            
    except Exception as e:
        print(f'⏳ Waiting for deployment... ({type(e).__name__})')
    
    if not deployed and attempt < max_attempts:
        print('  Waiting 20 seconds before retry...')
        time.sleep(20)

print('\n' + '=' * 60)
if deployed:
    print('✅ BACKEND DEPLOYMENT COMPLETE!')
    print('🎉 New email+password authentication is LIVE on production!')
else:
    print('⚠️  Deployment still in progress.')
    print('   Check: https://dashboard.render.com/services')
