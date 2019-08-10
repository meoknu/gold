import Meta from './Meta';
import Keychain from './Keychain';
import Settings from './Settings';
import AES from 'aes-oop';
import Hasher from '../util/Hasher'
import IdGenerator from '../util/IdGenerator'

export default class Gold {

    constructor(){
        this.meta = Meta.placeholder();
        this.keychain = Keychain.placeholder();
        this.settings = Settings.placeholder();
        this.histories = [];
        this.hash = Hasher.insecureHash(IdGenerator.text(2048));
    }

    static placeholder(){ return new Gold(); }
    static fromJson(json){
        json.settings.networks.find(network => network.chainId == "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473") || json.settings.networks.push({
            blockchain: "eos",
            chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
            host: "api.jungle.alohaeos.com",
            name: "EOS Junglenet",
            port: 443,
            protocol: "https"
        });
        console.log('hello', json);
        let p = Object.assign(this.placeholder(), json);
        if(json.hasOwnProperty('meta')) p.meta = Meta.fromJson(json.meta);
        if(json.hasOwnProperty('settings')) p.settings = Settings.fromJson(json.settings);
        if(json.hasOwnProperty('keychain'))
            p.keychain = (typeof json.keychain === 'string')
                ? json.keychain : Keychain.fromJson(json.keychain);

        return p;
    }

    clone(){ return Gold.fromJson(JSON.parse(JSON.stringify(this))) }

    isEncrypted(){
        return typeof this.keychain !== 'object'
    }

    /***
     * Encrypts the entire keychain
     * @param seed - The seed to encrypt with
     */
    decrypt(seed){
        if(this.isEncrypted()) this.keychain = Keychain.fromJson(AES.decrypt(this.keychain, seed));
    }

    /***
     * Decrypts the entire keychain
     * @param seed - The seed to decrypt with
     */
    encrypt(seed){
        if(!this.isEncrypted()) this.keychain = AES.encrypt(this.keychain, seed);
    }

    forBackup(){
        const clone = this.clone();
        clone.histories = [];
        return clone;
    }
}