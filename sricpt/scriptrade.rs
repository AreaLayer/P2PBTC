use bdk::
use ldk::
use lnd::
use obd::
use bitcoin::
use ln::

url = "http://127.0.0.1:<PORT>/wallet/<WALLET_NAME>"

headers = {
    'Authorization': 'Basic dXNlcjpwYXNz',
    'Content-Type': 'text/plain'
}

def getaddress():

    payload = "{\"jsonrpc\": \"1.0\", \"id\": \"p2p\", \"method\": \"getnewaddress\"}"
    response = requests.request("POST", url, headers=headers, data=payload)

    return response.json()['result']

def getkey():

    address =  getaddress()

    payload = "{\"jsonrpc\": \"1.0\", \"id\": \"p2p\", \"method\": \"getaddressinfo\", \"params\": [\"" + str(address)+ "\"]}"
    response = requests.request("POST", url, headers=headers, data=payload)

    return response.json()['result']['pubkey']

def registerkeys():

    alice_key = input("Enter public key for alice: ")
    bob_key = input("Enter public key for bob: ")
    carol_key = getkey()

    return alice_key, bob_key, carol_key

def createmultisig():

    payload = "{\"jsonrpc\": \"1.0\",\r\n \"id\": \"p2p\",\r\n  \"method\": \"createmultisig\",\r\n  \"params\": [2, [\"" + alice_key + "\",\"" + bob_key + "\",\"" + carol_key + "\"]]\r\n}"
    response = requests.request("POST", url, headers=headers, data=payload)

    return response.json()['result']['address'], response.json()['result']['descriptor']

def getutxo():

    url = "https://mempool.space/signet/api/address/" + multisig + "/utxo"
    response = requests.request("GET", url)

    time.sleep(15)

    if response.json() == []:
        getutxo()
    else:
        return response.json()[0]['txid'],response.json()[0]['value'], response.json()[0]['vout']

def createtx():

    payload = "{\"jsonrpc\": \"1.0\",\r\n \"id\": \"p2p\",\r\n  \"method\": \"createpsbt\",\r\n  \"params\": [[{\"txid\":\"" + str(funding_txid) + "\",\"vout\":" + str(vout) + "}],[{\"" + str(bob_address) + "\":\"" + str(bob_ov/100000000) + "\"},{\"" + str(carol_address) + "\":\"" + str(carol_ov/100000000) + "\"}]]\r\n}"
    response = requests.request("POST", url, headers=headers, data=payload)

    psbt = response.json()['result']

    return psbt

def finalizetx():

    payload = "{\"jsonrpc\": \"1.0\",\r\n \"id\": \"p2p\",\r\n  \"method\": \"finalizepsbt\",\r\n  \"params\": [\"" + str(signed_tx) + "\"]\r\n}"
    response = requests.request("POST", url, headers=headers, data=payload)

    final_tx = response.json()['result']['hex']

    return final_tx

def broadcast():

    payload = "{\"jsonrpc\": \"1.0\",\r\n \"id\": \"p2p\",\r\n  \"method\": \"sendrawtransaction\",\r\n  \"params\": [\"" + str(final_tx) + "\"]\r\n}"
    response = requests.request("POST", url, headers=headers, data=payload)

    release_txid = response.json()['result']

    return release_txid



if __name__=="__main__":

    alice_key, bob_key, carol_key = registerkeys()

    multisig, descriptor = createmultisig()
    print("\nAlice should send BTC to " + multisig + " for trade. This is a 2of3 multisig address.")
    print("\nDescriptor for multisig: " + descriptor)

    getutxo()

    while True:
        funding_txid, value,vout = getutxo()
        print("\n"+ str(value) + " sats received in " + str(funding_txid) + ":" + str(vout))
        print("\nBob should send money to Alice's bank account for completing this trade.")
        break

    bob_address = input("\nEnter the withdrawal address for bob:")
    carol_address = getaddress()

    fee = 1000
    carol_ov = (value*10)/100
    bob_ov = value - carol_ov - fee

    psbt = createtx()
    print("\nTransaction in PSBT format to release funds from 2of3 multisig (10 percent fee paid to carol and rest goes to bob):\n" + str(psbt))

    signed_tx = input("\nEnter signed transaction:")
    final_tx = finalizetx()
    release_txid = broadcast()

    print("\n" + str(int(bob_ov)) + " sats sent to Bob in " + str(release_txid))
