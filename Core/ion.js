const axios = require('axios');
const ionServerUrl = 'https://your-ion-server-url.com'; // Replace with your ION server URL
const pubKey = 'your_pubkey_here'; // Replace with the PubKey you want to use

async function getDIDDocument(did) {
  try {
    const response = await axios.get(`${ionServerUrl}/identifiers/${did}`);
    const didDocument = response.data;
    console.log('DID Document:', didDocument);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Call the function to retrieve the DID document
getDIDDocument(pubKey);

async function createDID(pubKey) {
  try {
    const response = await axios.post(`${ionServerUrl}/identifiers`, {
      input: {
        publicKeys: [
          {
            id: 'key-1',
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyJwk: {
              kty: 'EC',
              crv: 'secp256k1',
              x: 'base64-encoded-x-coordinate',
              y: 'base64-encoded-y-coordinate'
            }
          }
        ]
      }
    });
    const createdDocument = response.data.didDocument;
    console.log('Created DID Document:', createdDocument);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Call the function to create a new DID
createDID(pubKey);

