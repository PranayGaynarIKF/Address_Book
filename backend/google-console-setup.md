# Google Cloud Console Setup for OAuth

## Current Issue
You're getting `Error 400: redirect_uri_mismatch` because Google Cloud Console doesn't have the correct redirect URI.

## What Your App is Sending
Your backend is generating OAuth URLs with this redirect URI:
```
http://localhost:4002/api/mail-accounts/oauth-callback
```

## Current Status ✅
Your Google Cloud Console already has the correct redirect URI configured:
- `http://localhost:4002/api/mail-accounts/oauth-callback` ✅

## No Action Required
The redirect URI mismatch error should now be resolved because:
1. Your Google Cloud Console has: `http://localhost:4002/api/mail-accounts/oauth-callback`
2. Your application now uses: `http://localhost:4002/api/mail-accounts/oauth-callback`
3. Both match perfectly! ✅

## Test After Adding
Once you've added the URI and saved:
1. Try sending an email from your frontend
2. The OAuth popup should work without errors
3. You should be able to authenticate and send emails

## Troubleshooting
If you still get errors after adding the URI:
1. Make sure you copied the URI exactly: `http://localhost:3000/oauth-callback.html`
2. Make sure you saved the changes in Google Cloud Console
3. Wait 2-3 minutes for changes to propagate
4. Try again
