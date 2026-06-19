# SMS OTP Setup Guide

## How to Get Twilio Credentials

### Step 1: Sign Up for Twilio
1. Go to https://www.twilio.com/try-twilio
2. Create a free account (no payment needed for testing)
3. Verify your email

### Step 2: Get Your Credentials
1. Go to https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these values

### Step 3: Get a Twilio Phone Number
1. In Twilio console, go to **Phone Numbers** → **Manage**
2. Click **Get your first Twilio phone number**
3. Accept the suggested number
4. Copy your Twilio phone number (format: +1234567890)

### Step 4: Add to .env File

Add these lines to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Replace with your actual values from Twilio console.

### Step 5: Restart Backend

```powershell
cd "d:\smart job portal\backend"
python manage.py runserver
```

## Testing

### For Development (Without Real SMS)
If you don't add Twilio credentials, the OTP will be printed in the backend console for testing.

### For Production (Real SMS)
- Add Twilio credentials to .env
- Users will receive OTP via SMS to their phone
- SMS will arrive within 5-10 seconds

## Example Twilio Response
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxx
Twilio Number: +1234567890
```

## Free Tier Limits
- Send SMS to verified numbers only
- 100 free SMS credits per month
- Upgrade when ready for production

## Troubleshooting

### Error: "Phone number not verified"
- Verify your personal phone in Twilio console first
- Go to Verified Caller IDs and add your number

### Error: "Invalid credentials"
- Double-check Account SID and Auth Token
- Make sure there are no extra spaces in .env

### No SMS received
- Check internet connection
- Verify phone number format (+country_code + number)
- Check Twilio logs at https://console.twilio.com/logs
