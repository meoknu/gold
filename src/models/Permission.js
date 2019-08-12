import Network from './Network';
import Wallet from './Wallet';

export default class Permission {

    constructor(){
        // Mandatory
        this.domain = '';
        this.network = '';
        this.wallet = '';
        this.keypair = '';

        // Optional
        this.contract = null;
        this.action = null;
        this.checksum = null;

        this.timestamp = 0;

        this.fields = [];
        this.mutableFields = [];
    }

    static placeholder(){ return new Permission(); }
    static fromJson(json){
        let p = Object.assign(this.placeholder(), json);
        if(json.hasOwnProperty('network')) p.network = Network.fromJson(json.network);
        return p;
    }

    getWallet(keychain){
        return keychain.findWallet(this.wallet);
    }

    isWalletOnly(){
        return !this.contract && !this.action
    }

    isContractAction(){
        return !this.isWalletOnly() && this.contract.length && this.action.length
    }

    isWalletFor(domain){
        return this.isWalletOnly() && this.domain === domain;
    }
}