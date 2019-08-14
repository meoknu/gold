## Interacting with Gold
#### Catching browsers with Gold installed
```js
document.addEventListener('goldLoaded', goldExtension => {
    // Gold will now be available from the window scope.
    // At this stage the connection to Gold from the application is 
    // already encrypted. 
    const gold = window.gold;
    
    // It is good practice to take this off the window once you have 
    // a reference to it.
    window.gold = null;
     
    // If you want to require a specific version of Gold
    gold.requireVersion(3.0);
    
    //...
})
```


## Wallets

#### Requesting an Wallet

In order to do anything with a user's Gold you will need to request an Wallet.
Once an Wallet is provided it will not need to be re-approved every time unless the user removes the permission.
First setup your network, which your app will use for connection.
For Ropsten Ethereum Network  `chainId: '3'`
For Mainnet Ethereum Network  `chainId: '1'`
```js
// You can require certain fields
const  network = {
	blockchain:'eth',
	port:  '',
	protocol:  'https',
	host:  'ropsten.infura.io/v3/<INFURA_PROJECT_ID>',
	name:  "ETH Mainnet",
	chainId:  '3'
};
```
For EOS JungleNet you can use:
```js
const  network = {
	blockchain:'eos',
	port:  443,
	protocol:  'https',
	host:  'jungle2.cryptolions.io',
	chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'
};
```
For EOS Mainnet you can use:
```js
const  network = {
	blockchain:'eos',
	port:  443,
	protocol:  'https',
	host:  'bp.cryptolions.io',
	chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};
```
#### Getting Wallet for that network
```js
const  requiredFields = {
	accounts:[network]
};

gold.getWallet(requiredFields).then(wallet => {
    //...
}).catch(error => {
    //...
});
```

The wallet can also be accessed on `gold.wallet` so that you don't have to keep a reference to it.

**Note:** Every time an wallet is returned you should check it against your cache of their wallet. Properties are subject 
to change without notification to applications. Users have complete control over their own data. Do not rely on stale data for 
sensitive things like shipping physical items.

The `getWallet()` method can also take required fields. See the section about required fields below to 
find out how to build the object.

#### Forgetting an Wallet ( Sign out )

To sign out a user you will be removing the permission in place for your domain to use an wallet.
All sub-permissions such as contract and action whitelistings will be left in place and be available the next time the user 
authenticates with your website.

```js
gold.forgetWallet().then(() => {
    //...
});
```

Users can also do this without you providing a way for them to do so from their own permissions panel.


#### Using Gold with [eosjs](https://github.com/EOSIO/eosjs)

```js
// Set up any extra options you want to use eosjs with. 
const eosOptions = {};
 
// Get a reference to an 'Eosjs' instance with a Gold signature provider.
const eos = gold.eos( network, Eos, eosOptions, 'https' );
```


#### Using Gold with [web3](https://github.com/ethereum/web3.js/)

```js
// You can pass in either an HTTP or WebSocket provider prefix to the network
const protocol = 'http' || 'ws';

// Get a reference to a 'Web3' instance with a Gold signature provider.
const web3 = gold.eth(network, Web3, protocol);
```

#### Requesting a Signature

Using Gold to provide signatures is no different than using `eosjs` or `web3`.
It just handles all the signature provision for you.

```js
// eosjs
eos.contract('hello').then(contract => {
    contract.hi(...args)
});
 
// Web3
// Basic transaction
web3.eth.sendTransaction({
    from: account.publicKey,
    to: '0x11f4d0.....',
    value: '1'
})
```
 
#### Finding Accounts by Blockchain

```js
const eosAccount = wallet.accounts.find(account => account.blockchain === 'eos');
const ethAccount = wallet.accounts.find(account => account.blockchain === 'eth');
```



