# P2P BTC 🔑
Marketplace P2P on Lightning Network to allow buy and sell BTCs or Satoshis on second layer.

![image](https://user-images.githubusercontent.com/83122757/208185368-8b25d762-3b7c-4ea9-a768-d122d8a37e7b.png)

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
npm install / yarn
```

## Compile
```
npm run start
```

### Compiles and minifies for production
```
npm run build
```
## Prototype

https://p2pbtc.stackblitz.io

# To-Do

- [ ] Testnet
- [ ] Integration with LND, OBD, LDK  and Ecalir
- [ ] Mainnet
- [ ] Fees
- [ ] UI via Terminal
- [ ] Nostr integration
- [ ] OmniLayer integration for Buy/Sell with pair BTC/USDT
