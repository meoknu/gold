# Gold Classic

Gold is a browser extension that allows you to sign transactions for multiple blockchains and provide personal information to web applications without ever exposing your keys or filling out forms.

## Table of Contents

- [Installing Gold](https://github.com/GetGold/GoldWebExtension#installation)
- [Interacting With Gold](https://github.com/GetGold/GoldWebExtension#interacting-with-gold)
- [Translations and Localization](https://github.com/GetGold/GoldWebExtension#translations-and-localization)
- [Understanding Gold's Security](https://github.com/GetGold/GoldWebExtension#security)
- [Contributing to Gold](https://github.com/GetGold/GoldWebExtension#contributing)
- [Responsible Disclosure and Bug Bounties](https://github.com/GetGold/GoldWebExtension#responsible-disclosure-and-bug-bounties)




## Installation


#### Getting the Chrome Extension files

**Note: If you are developing locally make sure you have enabled the** `history_api` **plugin in your nodeos config or you will not be able to import accounts!**

**From Chrome Store**
- [Go to Chrome Store](https://chrome.google.com/webstore/detail/gold/ammjpmhgckkpcamddpolhchgomcojkle)

**From The Repository** 
* Clone repository
* [In some cases](https://github.com/EOSEssentials/Gold/pull/43) on a Windows system you will need to run `npm install --global --production windows-build-tools`
* `npm install` to get dependencies
* copy the `.env.example` file to `.env`
* `npm start` to compile a `build` folder.


#### Installing a dev build into Chrome



* Open up **Chrome** and type `chrome://extensions/` into the url bar
* Click the `Load unpacked extension...` button and point it at the folder you just created/built 
(_the folder should have a manifest.json inside of it_).





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

```js
// You can require certain fields
gold.getWallet().then(wallet => {
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

#### Authenticating an Wallet

Wallets can be authenticated using asymmetric encryption.
If the `authenticate` method does not throw an error then the wallet has been authenticated.
```js

// Authenticate takes no parameters. 
// It will fail if there is no wallet bound to Gold.
gold.authenticate()
    .then(sig => {
        // This will return your `location.host` 
        // signed with their Wallet's private key.
        // It has already been validated, but you can validate it yourself as well using eosjs-ecc.
        
        ecc.verify(sig, location.host, gold.wallet.publicKey);
    })
    .catch(err => console.log('auth err', err))
```


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


## Networks

Networks are used to connect to blockchain nodes and reference blockchain accounts. 
They must be formatted like so:

```js
const network = {
    protocol:'http', // Defaults to https
    blockchain:'eos',
    host:'127.0.0.1', // ( or null if endorsed chainId )
    port:8888, // ( or null if defaulting to 80 )
    chainId:1 || 'abcd',
}
```

**A note about chainId** - If the user has a chainId in their network inside of Gold providing the host/port
will not be enough. You should always aim for chainId inclusion.

Gold has a few endorsed networks that is uses for retrieving information such as an 
`EOS Mainnet ( chainId aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906 )` 
and `ETH Mainnet ( chainId 1 )`. If you are using those you can 
simply leave the `host` and `port` null and it will default to the chainId internally when fetching accounts from 
the wallet. 

#### Suggesting a network to the user

You can _suggest_ that the user add a network to their Gold if you are not using a generic network.

```js
gold.suggestNetwork(network);
```

This will provide a prompt for them which will display the network they will be adding, and give them a chance
to accept or deny the addition.



## Signature Providers


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
 
// Or on a contract method
const abi = require('some_abi.json');
contract.methods.hello(...args).send({from:account.publicKey, abi})
```

#### Multi-part signatures involving the application AND an Wallet

_Note: Ethereum does not support multiple signatures within one request_

You may also double-sign signatures using a private key from the application as well as one supplied by 
the user.

```js
// DO NOT DO THIS! If you do this you will give the client your keys.
const signProvider = (buf, sign) => {
    // You should validate the `buf` before signing it.
    // If you do not you could be signing anything from a malicious Gold mimic
    
    // Use the provided eosjs signer ( less secure, could be a mimic ) 
    return sign(buf, 'SOME_PRIVATE_KEY');
    
    // or use eosjs-ecc instead ( more secure as you own the reference )
    return ecc.sign(buf, 'SOME_PRIVATE_KEY')
};
 
eos.contract('hello', { signProvider }).then(contract => {
    contract.hi(...args);
});
 
 
// Instead of the above defer your signing to a backend
const signProvider = async (buf, sign) => await YourApiService.sign(buf);
```



##  Requiring Wallet Fields

You can optionally pass a `RequiredFields` object into either the `getWallet()` method or 
to individual transactions as options. 

**Do not rely on previously acquired Wallet 
properties, since users might have multiple locations such as Work and Home, and they might have changed other properties 
since the last time you cached them.**

##### Requireable Wallet Fields
- **accounts** `[]` 
    - accepts an array of networks

##### Fields that always return from `getWallet()`
- **name** - The user's unique name.
- **publicKey** - The public key associated with the Wallet.
- **hash** - A hash of the Wallet's public key.

#### The Required Fields Object

```js
const requiredFields = {
    personal:['firstname', 'email'],
    location:['country'],
    accounts:[
        {blockchain:'eos', host:'127.0.0.1', port:8888},
        {blockchain:'eth', chainId:1}
    ]
};
```

This object can be passed into either the `getWallet()` method or individual transactions.

```js
// Get Wallet
gold.getWallet(requiredFields)...
 
// eosjs
const contract = await eos.contract('hello', {requiredFields});
 
// Web3
// On a regular transaction
web3.eth.sendTransaction({
    from: publicKey,
    to: '0x11f4d......',
    value: '1',
    requiredFields,
    fieldsCallback
})

const fieldsCallback = fields => console.log('Returned Fields', fields);
const options = {from:publicKey, abi, requiredFields, fieldsCallback};
contract.methods.hello(...args).send(options)
```

It's best practice to not request location fields until they are needed, as user's can have multiple 
locations inside of an Wallet ( work/home ), and can select which one to user per signature request.

This allows you to request all information needed for a physical sale with one click.

_For instance in this case we could be a shopping website that needs shipping details along with 
the transfer of digital currency._

#### EOS Stipulations

When using requiredFields on EOS transactions you need to put the requirements into the uppermost method and not the 
action as requirements should fulfill any and all actions within; including multiple atomic transactions and not just per action.
```js
//CORRECT
eos.contract('hello', {requiredFields}).then(contract => contract.hi(...args))
 
//INCORRECT
eos.contract('hello').then(contract => contract.hi(...args, {requiredFields}))
```

#### Ethereum Stipulations

When you request signatures for contract methods you **must** supply the abi of the contract. This allows Gold to 
display the decoded fields to the user so they can see exactly what they are signing.

**Ethereum support is currently lacking as it is a new development.** Some things are missing, such as the ability for users 
to change gas price and limit.
 
#### Finding Accounts by Blockchain

```js
const eosAccount = wallet.accounts.find(account => account.blockchain === 'eos');
const ethAccount = wallet.accounts.find(account => account.blockchain === 'eth');
```






## Arbitrary signatures

You can request an arbitrary signature from Gold on any type of data you wish.
Signatures on the Wallet will always use `eosjs-ecc` as they are EOS keys.

```js
gold.getArbitrarySignature(
    publicKey, 
    data, 
    whatfor = 'Login Authentication', 
    isHash = false
)
```

If you need to sign a `sha256` hash be sure to set `isHash` to `true` as this uses a different signing method.
Otherwise always leave it to false.

**User's will always see the exact data they are signing the same way they see transactions.**