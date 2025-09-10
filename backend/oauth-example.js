// Example backend endpoint for Gmail OAuth URL generation
// This should be implemented in your actual backend

const express = require('express');
const { google } = require('googleapis');

const app = express();

// Gmail OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000' // Your frontend URL
);

// Generate OAuth URL
app.post('/api/mail-accounts/oauth-url', async (req, res) => {
  try {
    const { provider, redirectUri } = req.body;
    
    if (provider !== 'gmail') {
      return res.status(400).json({ error: 'Only Gmail provider is supported' });
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    const state = `gmail_oauth_${Date.now()}`;
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
      redirect_uri: redirectUri
    });

    res.json({ authUrl, state });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

// Handle OAuth callback
app.post('/api/mail-accounts/oauth-callback', async (req, res) => {
  try {
    const { code, state, provider } = req.body;
    
    if (provider !== 'gmail') {
      return res.status(400).json({ error: 'Only Gmail provider is supported' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in your database
    // await storeTokensInDatabase(tokens, state);

    res.json({ 
      success: true, 
      message: 'Gmail authentication successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = app;
