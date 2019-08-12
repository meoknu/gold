import {LocalStream} from 'extension-streams';
import AES from 'aes-oop';
import * as InternalMessageTypes from './messages/InternalMessageTypes';
import InternalMessage from './messages/InternalMessage';
import StorageService from './services/StorageService'
import SignatureService from './services/SignatureService'
import Gold from './models/Gold'
import Network from './models/Network'
import WalletService from './services/WalletService'
import NotificationService from './services/NotificationService'
import HistoricEvent from './models/histories/HistoricEvent'
import * as HistoricEventTypes from './models/histories/HistoricEventTypes'
import Prompt from './models/prompts/Prompt';
import * as PromptTypes from './models/prompts/PromptTypes'
import Permission from './models/Permission'
import TimingHelpers from './util/TimingHelpers';
import Error from './models/errors/Error'
import PluginRepository from './plugins/PluginRepository'
import {Blockchains, BlockchainsArray} from './models/Blockchains'
import {apis} from './util/BrowserApis';
import migrate from './migrations/migrator'
// Gets bound when a user logs into gold
// and unbound when they log out
// Is not on the Background's scope to keep it private
let seed = '';

let inactivityInterval = 0;
let timeoutLocker = null;

let prompt = null;

// This is the script that runs in the extension's background ( singleton )
export default class Background {

    constructor(){
        this.setupInternalMessaging();
    }



    /********************************************/
    /*               VueInitializer             */
    /********************************************/

    // Watches the internal messaging system ( LocalStream )
    setupInternalMessaging(){
        LocalStream.watch((request, sendResponse) => {
            const message = InternalMessage.fromJson(request);
            this.dispenseMessage(sendResponse, message);
        })
    }

    /***
     * Delegates message processing to methods by message type
     * @param sendResponse - Delegating response handler
     * @param message - The message to be dispensed
     */
    dispenseMessage(sendResponse, message){
        Background.checkAutoLock();
        switch(message.type){
            case InternalMessageTypes.SET_SEED:                         Background.setSeed(sendResponse, message.payload); break;
            case InternalMessageTypes.SET_TIMEOUT:                      Background.setTimeout(sendResponse, message.payload); break;
            case InternalMessageTypes.IS_UNLOCKED:                      Background.isUnlocked(sendResponse); break;
            case InternalMessageTypes.LOAD:                             Background.load(sendResponse); break;
            case InternalMessageTypes.UPDATE:                           Background.update(sendResponse, message.payload); break;
            case InternalMessageTypes.PUB_TO_PRIV:                      Background.publicToPrivate(sendResponse, message.payload); break;
            case InternalMessageTypes.DESTROY:                          Background.destroy(sendResponse); break;
            case InternalMessageTypes.WALLET_FROM_PERMISSIONS:        Background.walletFromPermissions(sendResponse, message.payload); break;
            case InternalMessageTypes.GET_OR_REQUEST_WALLET:          Background.getOrRequestWallet(sendResponse, message.payload); break;
            case InternalMessageTypes.FORGET_WALLET:                  Background.forgetWallet(sendResponse, message.payload); break;
            case InternalMessageTypes.REQUEST_SIGNATURE:                Background.requestSignature(sendResponse, message.payload); break;
            case InternalMessageTypes.REQUEST_ARBITRARY_SIGNATURE:      Background.requestArbitrarySignature(sendResponse, message.payload); break;
            case InternalMessageTypes.REQUEST_ADD_NETWORK:              Background.requestAddNetwork(sendResponse, message.payload); break;
            case InternalMessageTypes.REQUEST_GET_VERSION:              Background.requestGetVersion(sendResponse); break;
            case InternalMessageTypes.REQUEST_VERSION_UPDATE:           Background.requestVersionUpdate(sendResponse, message.payload); break;
            case InternalMessageTypes.AUTHENTICATE:                     Background.authenticate(sendResponse, message.payload); break;
            case InternalMessageTypes.ABI_CACHE:                        Background.abiCache(sendResponse, message.payload); break;
            case InternalMessageTypes.SET_PROMPT:                       Background.setPrompt(sendResponse, message.payload); break;
            case InternalMessageTypes.GET_PROMPT:                       Background.getPrompt(sendResponse); break;
        }
    }

    // Lock the user due to inactivity
    static checkAutoLock() {
        if(inactivityInterval === 0) return false;
        if (timeoutLocker) clearTimeout(timeoutLocker);
        if (seed) timeoutLocker = setTimeout(() => seed = '', inactivityInterval);
    }


    static setPrompt(sendResponse, notification){
        prompt = notification;
        sendResponse(true);
    }

    static getPrompt(sendResponse){
        sendResponse(prompt);
    }

    /********************************************/
    /*                 Handlers                 */
    /********************************************/

    /***
     * Sets the seed on scope to use from decryption
     * @param sendResponse - Delegating response handler
     * @param _seed - The seed to set
     */
    static setSeed(sendResponse, _seed){
        seed = _seed;
        sendResponse(true);
    }

    /***
     * Checks whether Gold is locked
     * @param sendResponse - Delegating response handler
     * @returns {boolean}
     */
    static isUnlocked(sendResponse){
        // Even if a seed is set, that doesn't mean that the seed is correct.
        if(seed.length) StorageService.get().then(gold => {
            try {
                gold.decrypt(seed);
                sendResponse(!gold.isEncrypted());
            } catch(e) {
                seed = '';
                sendResponse(false);
            }
        });
        // If no seed is set, Gold is definitely locked
        else sendResponse(false);
    }

    /***
     * Returns the saved instance of Gold from the storage
     * @param sendResponse - Delegating response handler
     * @returns {Gold}
     */
    static load(sendResponse){
        StorageService.get().then(async gold => {
            // sync the timeout inactivity interval
            inactivityInterval = gold.settings.inactivityInterval;

            if(!seed.length) return sendResponse(gold);

            gold.decrypt(seed);
            const migrated = await migrate(gold);
            if(migrated) this.update(() => {}, gold);
            sendResponse(gold)
        })
    }

    /***
     * Updates the Gold instance inside persistent storage
     * @param sendResponse - Delegating response handler
     * @param gold - The updated cleartext Gold instance
     * @returns {boolean}
     */
    static update(sendResponse, gold){
        this.lockGuard(sendResponse, () => {
            console.log(gold);
            gold = Gold.fromJson(gold);

            // Private Keys are always separately encrypted
            gold.keychain.keypairs.map(keypair => keypair.encrypt(seed));
            gold.keychain.wallets.map(id => id.encrypt(seed));

            // Keychain is always stored encrypted.
            gold.encrypt(seed);

            StorageService.save(gold).then(saved => {
                gold.decrypt(seed);
                sendResponse(gold)
            })
        })
    }

    /***
     * Retrieves a Private Key from a Public Key
     * @param sendResponse - Delegating response handler
     * @param publicKey - The Public Key to search for
     * @returns {privateKey:string | null}
     */
    static publicToPrivate(sendResponse, publicKey){
        this.lockGuard(sendResponse, () => {
            StorageService.get().then(gold => {
                gold.decrypt(seed);
                let keypair = gold.keychain.keypairs.find(keypair => keypair.publicKey === publicKey);
                if(!keypair) keypair = gold.keychain.wallets.find(id => id.publicKey === publicKey);
                sendResponse((keypair) ? AES.decrypt(keypair.privateKey, seed) : null);
            })
        })
    }

    /***
     * Destroys this instance of Gold
     * @param sendResponse
     */
    static destroy(sendResponse){
        // TODO: Mock
        this.lockGuard(sendResponse, () => {
            console.log("Destroying");
            seed = '';
            apis.storage.local.clear();
            sendResponse(true);
        })
    }

    /***
     * Sets the timeout interval on scope to determine the lockout time
     * @param sendResponse - Delegating response handler
     * @param _timeoutMinutes - The timeout minutes to set
     */
    static setTimeout(sendResponse, _timeoutMinutes){
        this.load(gold => {
            inactivityInterval = TimingHelpers.minutes(_timeoutMinutes);
            gold.settings.inactivityInterval = inactivityInterval;
            this.update(() => {}, gold);
        });

        sendResponse(true);
    }













    /********************************************/
    /*              Web Application             */
    /********************************************/

    static walletFromPermissions(sendResponse, payload){
        if(!seed.length) {
            sendResponse(null);
            return false;
        }

        Background.load(gold => {
            const domain = payload.domain;
            const permission = WalletService.walletPermission(domain, gold);
            if(!permission){
                sendResponse(null);
                return false;
            }
            const wallet = permission.getWallet(gold.keychain);
            sendResponse(wallet.asOnlyRequiredFields(permission.fields));
        });
    }

    /***
     * Prompts a request for Wallet provision
     * @param sendResponse
     * @param payload
     */
    static getOrRequestWallet(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {
                const {domain, fields} = payload;

                WalletService.getOrRequestWallet(domain, fields, gold, (wallet, fromPermission) => {
                    if(!wallet){
                        sendResponse(Error.signatureError("wallet_rejected", "User rejected the provision of an Wallet"));
                        return false;
                    }

                    if(!fromPermission) {
                        this.addHistory(HistoricEventTypes.PROVIDED_WALLET, {
                            domain,
                            provided:!!wallet,
                            walletName:wallet ? wallet.name : false,
                            publicKey:(wallet) ? wallet.publicKey : false
                        });

                        this.addPermissions([Permission.fromJson({
                            domain,
                            wallet:wallet.publicKey,
                            timestamp:+ new Date(),
                            fields,
                            checksum:domain
                        })])
                    }

                    sendResponse(wallet);
                });
            });
        })
    }

    static forgetWallet(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {
                const permission = gold.keychain.permissions.find(permission => permission.isWalletOnly() && permission.domain === payload.domain);
                if(!permission){
                    sendResponse(true);
                    return false;
                }

                const clone = gold.clone();
                clone.keychain.removePermission(permission);

                this.update(() => {
                    sendResponse(true);
                }, clone);
            })
        })
    }

    /***
     * Authenticates the Wallet by returning a signed passphrase using the
     * private key associated with the Wallet
     * @param sendResponse
     * @param payload
     */
    static authenticate(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {
                const wallet = gold.keychain.findWallet(payload.publicKey);
                if(!wallet) return sendResponse(Error.walletMissing());
                wallet.decrypt(seed);

                const plugin = PluginRepository.plugin(Blockchains.EOS);
                plugin.signer(this, {data:payload.domain}, wallet.publicKey, sendResponse, true);
            })
        })
    }

    static abiCache(sendResponse, payload){
        this.lockGuard(sendResponse, async () => {
            sendResponse(payload.abiGet
                ? await StorageService.getABI(payload.abiContractName, payload.chainId)
                : await StorageService.cacheABI(payload.abiContractName, payload.chainId, payload.abi));
        })
    }

    /***
     * Prompts a request for a transaction signature
     * @param sendResponse
     * @param payload
     */
    static requestSignature(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {
                SignatureService.requestSignature(payload, gold, this, sendResponse);
            })
        })
    }

    /***
     * Prompts a request for an arbitrary signature
     * @param sendResponse
     * @param payload
     */
    static requestArbitrarySignature(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {
                SignatureService.requestArbitrarySignature(payload, gold, this, sendResponse);
            })
        })
    }

    /***
     *
     * @param sendResponse
     * @param payload
     */
    static requestAddNetwork(sendResponse, payload){
        this.lockGuard(sendResponse, () => {
            Background.load(gold => {


                const network = Network.fromJson(payload.network);
                console.log('network', network, BlockchainsArray);

                if(!BlockchainsArray.map(x => x.value).includes(network.blockchain)){
                    sendResponse(new Error('bad_blockchain', 'The blockchain you specified is not supported by Gold'));
                    return;
                }

                // Already has network, returning true
                if(gold.settings.networks.find(_network => _network.unique() === network.unique())) sendResponse(true);

                // Prompting for network addition
                else NotificationService.open(new Prompt(PromptTypes.REQUEST_ADD_NETWORK, payload.domain, payload.network, network, approved => {
                    if(approved === false || approved.hasOwnProperty('isError')) sendResponse(approved);
                    else {
                        gold.settings.networks.unshift(network);
                        this.update(() => sendResponse(approved), gold);
                    }
                }));

            })
        })
    }

    /***
     * Gets the current version of the app from the manifest.json
     * @param sendResponse
     */
    static requestGetVersion(sendResponse){
        sendResponse(apis.app.getDetails().version)
    }

    /***
     * Notifies the user that the application they are using is
     * requiring a newer version of Gold than they have installed
     * @param sendResponse
     * @param payload
     */
    static requestVersionUpdate(sendResponse, payload){
        const network = Network.fromJson({host:'', port:0});
        NotificationService.open(new Prompt(PromptTypes.UPDATE_VERSION, payload.domain, network, network, () => {}))
    }





    /********************************************/
    /*                 Helpers                  */
    /********************************************/

    /***
     * Returns a an error if Gold is locked,
     * or passes through the callback if Gold is open
     * @param sendResponse - Delegating response handler
     * @param cb - Callback to perform if open
     */
    static lockGuard(sendResponse, cb){
        if(!seed.length) {
            NotificationService.open(Prompt.goldIsLocked());
            sendResponse(Error.locked());
        }
        else cb();
    }



    /***
     * Adds a historic event to the keychain
     * @param type
     * @param data
     */
    static addHistory(type, data){
        this.load(gold => {
            // gold.histories.unshift(new HistoricEvent(type, data));
            // this.update(() => {}, gold);
        })
    }

    /***
     * Adds a permission to the keychain
     * @param permissions
     */
    static addPermissions(permissions){
        this.load(gold => {
            permissions.map(permission => {
                if(!gold.keychain.hasPermission(permission.checksum, permission.fields))
                    gold.keychain.permissions.unshift(permission);
            });
            this.update(() => {}, gold);
        })
    }

}

const background = new Background();
