const NostrClient = require('nostr-js').NostrClient;
const NostrUtils = require('nostr-js').NostrUtils;
const WebSocket = require('ws');

const websocketEndpoint = 'wss://relay.damus.com'; // Replace with your Nostr server endpoint
const nostrClient = new NostrClient(new WebSocket(websocketEndpoint));

const pubKey = 'your_pubkey_here'; // Replace with the PubKey you want to subscribe to
nostrClient.subscribePubKey(pubKey);


nostrClient.onUpdate((update) => {
  const { pubKey, data } = update;
  console.log(`Received update for PubKey ${pubKey}:`, data);
  // Handle the update as needed
});

const updateData = { message: 'Hello, Nostr!' }; // Replace with your update data
nostrClient.sendUpdate(pubKey, updateData);
