import Wallet from '../models/Wallet'
import Prompt from '../models/prompts/Prompt';
import * as PromptTypes from '../models/prompts/PromptTypes'
import NotificationService from '../services/NotificationService'

export default class WalletService {

    //TODO Mock
    static register(name, gold){
        return new Promise((resolve, reject) => {
            resolve(true)
        })
    }

    //TODO Mock
    static nameExists(name, gold){
        return new Promise((resolve, reject) => {
            // Check if exists within another gold
            resolve(false);
        })
    }

    static walletPermission(domain, gold){
        return gold.keychain.permissions.find(perm => perm.isWalletFor(domain));
    }

    static walletFromPermissionsOrNull(domain, gold){
        const walletFromPermission = WalletService.walletPermission(domain, gold);
        return walletFromPermission ? walletFromPermission.getWallet(gold.keychain) : null;
    }

    static getOrRequestWallet(domain, fields, gold, callback){

        // Possibly getting an Wallet that has been synced with this application.
        const walletFromPermission = WalletService.walletFromPermissionsOrNull(domain, gold);
        let wallet = walletFromPermission;

        const sendBackWallet = id => {
            if(!id || id.hasOwnProperty('isError')){
                callback(null, null);
                return false;
            }

            callback(id.asOnlyRequiredFields(fields), !!walletFromPermission);
        };

        if(wallet){
            // Even though there is a previous permission,
            // the wallet might have changed and no longer
            // meets the requirements.
            if(wallet.hasRequiredFields(fields)){
                sendBackWallet(wallet);
                return false;
            } else {
                // TODO: Remove permission
            }
        }
        else NotificationService.open(new Prompt(PromptTypes.REQUEST_WALLET, domain, null, fields, sendBackWallet));
    }
}