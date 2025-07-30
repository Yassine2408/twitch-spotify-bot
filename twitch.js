const tmi = require('tmi.js');
const crypto = require('crypto');
const spotify = require('./spotify');

const twitchClient = new tmi.Client({
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [process.env.TWITCH_CHANNEL]
});

twitchClient.connect().catch(console.error);

// EventSub webhook handler
function handleEventSubWebhook(req, res) {
  const messageId = req.header('Twitch-Eventsub-Message-Id');
  const timestamp = req.header('Twitch-Eventsub-Message-Timestamp');
  const signature = req.header('Twitch-Eventsub-Message-Signature');
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(messageId + timestamp + body);
  const expectedSignature = 'sha256=' + hmac.digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).send('Invalid signature');
  }

  // Handle EventSub challenge
  if (req.body.challenge) {
    return res.status(200).send(req.body.challenge);
  }

  // Only handle channel points custom reward redemption
  if (
    req.body.event &&
    req.body.subscription &&
    req.body.subscription.type === 'channel.channel_points_custom_reward_redemption.add'
  ) {
    const userInput = req.body.event.user_input;
    if (userInput) {
      spotify.handleSongRequest(userInput).catch(console.error);
    }
  }

  res.status(200).end();
}

module.exports = {
  handleEventSubWebhook
}; 