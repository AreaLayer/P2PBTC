const { LightningClient } = require('./lnd_pb_service');
const { GetInfoRequest } = require('./lnd_pb');
const { LightningClient} = require(/cln_pb_service');

const lndHost = 'http://localhost:8080'; // Replace with your LND host
const clnHostr = 'http://localhost:8080';

// Create the gRPC client
const client = new LightningClient(lndHost, null, null);

// Define a function to get LND node information
async function getNodeInfo() {
  const request = new GetInfoRequest();
  try {
    const response = await client.getInfo(request, {});
    const info = response.toObject();
    console.log('LND Node Info:', info);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
// Define a function for CLN Node

// Call the function to get node information
getNodeInfo();
