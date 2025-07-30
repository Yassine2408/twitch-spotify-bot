require('dotenv').config();
const express = require('express');
const twitch = require('./twitch');
const spotify = require('./spotify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.send('Twitch Spotify Bot is running!');
});

// Spotify login
app.get('/login', (req, res) => {
  const authorizeURL = spotify.getAuthorizeURL();
  res.redirect(authorizeURL);
});

// Spotify OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    await spotify.handleOAuthCallback(code);
    res.send('Spotify authentication successful! You can close this window.');
  } catch (err) {
    res.status(500).send('Spotify authentication failed: ' + err.message);
  }
});

// Twitch EventSub webhook endpoint
app.post('/eventsub', twitch.handleEventSubWebhook);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 