var request = require('request');

var options = {
  'method': 'GET',
  'url': 'https://api.zebedee.io/v0/wallet',
  'headers': {
    'Content-Type': 'application/json',
    'apikey': 'API_KEY'
  }
};

request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
