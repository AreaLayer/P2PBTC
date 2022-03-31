# P2P BTC 🔑
Marketplace P2P on Lightning Network to allow buy and sell BTCs or Satoshis on second layer.

![image](https://user-images.githubusercontent.com/83122757/154938952-921c54ef-3f2b-462e-8a93-7d037a7a5a56.png)

# Security

The Marketplace have security of the Layer 1 from Bitcoin

# Fees

For each good negotiation will be include  a fee of 0.04%

# How works? 

We will use OP_RETURN used for a transaction between parties when a not realize pay to the other.
Example:

Bob sells 0.05 BTC for Alice with price of 1000 USDT. But Alice not pay Bob. Like this we put OP_RETURN. Saving Bitcoins from Bob.

Wiki: https://en.bitcoin.it/wiki/Script

## Deploy and Mainnet

```
Clone the repo, install requirements and compile

git clone https://github.com/P2PBTC.git

cd p2pbtc && npm i && npm run compile

Start btc & lnd

npm run docker:regtest

Start LN npm run p2pbtc:geth

Start the app

npm run start
