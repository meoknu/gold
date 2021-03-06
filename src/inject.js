import IdGenerator from './util/IdGenerator';
import {EncryptedStream} from 'extension-streams';
import * as PairingTags from './messages/PairingTags'
import * as NetworkMessageTypes from './messages/NetworkMessageTypes'
import Golddapp from './golddapp';
// Web3 = require('web3');
import Web3 from 'web3';
import eosjs from 'eosjs';

/***
 * This is the javascript which gets injected into
 * the application and facilitates communication between
 * Gold and the web application.
 */
class Inject {

    constructor(){
        // Injecting an encrypted stream into the
        // web application.
        const stream = new EncryptedStream(PairingTags.INJECTED, IdGenerator.text(64));

        // Waiting for gold to push itself onto the application
        stream.listenWith(msg => {
            if(msg && msg.hasOwnProperty('type') && msg.type === NetworkMessageTypes.PUSH_GOLD)
                window.gold = new Golddapp(stream, msg.payload);
                window.Web3 = Web3;
                window.Eos = eosjs;
        });

        // Syncing the streams between the
        // extension and the web application
        stream.sync(PairingTags.GOLD, stream.key);
    }

}

new Inject();




