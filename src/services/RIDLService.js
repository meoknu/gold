import ridl from 'ridl';
import * as Actions from '../store/constants';
import AlertMsg from '../models/alerts/AlertMsg'
import PluginRepository from '../plugins/PluginRepository'
import {Blockchains} from '../models/Blockchains'

const enabled = false;

setTimeout(() => {
    PluginRepository.plugin(Blockchains.EOS)
        .getEndorsedNetwork()
        .then(network => ridl.setNetwork(network));
}, 50);

export default class RIDLService {

    constructor(){}

    static async claimWallet(newName, wallet, context){
        return new Promise(async(resolve,reject) => {

            if(!newName.length) return reject(null);
            const hash = await ridl.identity.getHash(newName);
            if(!hash) return reject(context[Actions.PUSH_ALERT](AlertMsg.NoSuchWalletName()));

            context[Actions.PUSH_ALERT](AlertMsg.ClaimWallet(newName)).then(async res => {
                if(!res || !res.hasOwnProperty('text')) return reject(null);

                if(!PluginRepository.plugin(Blockchains.EOS).validPrivateKey(res.text))
                    return reject(context[Actions.PUSH_ALERT](AlertMsg.InvalidPrivateKey()));

                const signedHash = ridl.sign(hash, res.text);
                delete res.text;

                const claimed = await ridl.identity.claim(newName, signedHash, wallet.publicKey);
                if(!claimed) return reject(context[Actions.PUSH_ALERT](AlertMsg.NoSuchWalletName()));

                // Removing now unused randomized RIDL account
                if(!await ridl.identity.registered(wallet.name)) {
                    const previousHash = await ridl.identity.getHash(wallet.name);
                    const signedStaleHash = previousHash ? await context[Actions.SIGN_RIDL]({hash:previousHash, publicKey:wallet.publicKey}) : false;
                    if(signedStaleHash) await ridl.identity.release(wallet.name, signedStaleHash);
                }

                wallet.name = newName;
                wallet.ridl = parseInt(claimed.registered);
                resolve(wallet);
                //5KjbZQLH3EAfgXF3jejYM2WZjzJCUQH7NEkT1mVcBy2xoFdSWro
            })

        });


    }

    static async identify(publicKey){
        if(!enabled) return ridl.identity.randomName();
        const name = await ridl.identity.randomUniqueName();
        if(!await ridl.identity.identify(name, publicKey)) return null;
        return name;
    }
}