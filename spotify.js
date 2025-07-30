const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

if (process.env.SPOTIFY_REFRESH_TOKEN) {
  spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
}

function getAuthorizeURL() {
  return spotifyApi.createAuthorizeURL([
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify'
  ], 'state');
}

async function handleOAuthCallback(code) {
  const data = await spotifyApi.authorizationCodeGrant(code);
  spotifyApi.setAccessToken(data.body['access_token']);
  spotifyApi.setRefreshToken(data.body['refresh_token']);
  // Print refresh token for .env
  console.log('SPOTIFY_REFRESH_TOKEN=' + data.body['refresh_token']);
  return data.body;
}

async function refreshAccessTokenIfNeeded() {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);
    return data.body['access_token'];
  } catch (err) {
    console.error('Could not refresh Spotify access token', err);
    throw err;
  }
}

async function handleSongRequest(query) {
  // Always refresh token before playing
  await refreshAccessTokenIfNeeded();
  const search = await spotifyApi.searchTracks(query, { limit: 1 });
  if (!search.body.tracks.items.length) {
    throw new Error('No track found for: ' + query);
  }
  const trackUri = search.body.tracks.items[0].uri;
  try {
    await spotifyApi.play({ uris: [trackUri] });
  } catch (err) {
    if (err.body && err.body.error && err.body.error.reason === 'NO_ACTIVE_DEVICE') {
      console.error('No active Spotify device. Please start playback on a device.');
    } else {
      console.error('Spotify play error:', err);
    }
    throw err;
  }
}

module.exports = {
  getAuthorizeURL,
  handleOAuthCallback,
  handleSongRequest
}; 