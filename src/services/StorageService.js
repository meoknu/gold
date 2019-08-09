import Gold from '../models/Gold'
import {apis} from '../util/BrowserApis';

export default class StorageService {

    constructor(){}

    /***
     * Saves an instance of Gold in the extension's local storage
     * The keychain will always be encrypted when in storage
     * @param gold
     * @returns {Promise}
     */
    static save(gold){
        return new Promise(resolve => {
            apis.storage.local.set({gold}, () => {
                resolve(gold);
            });
        })
    };

    /***
     * Gets an instance of Gold from the extension's local storage
     * Will return a new Gold instance if not found.
     * @returns {Promise}
     */
    static get() {
        return new Promise(resolve => {
            apis.storage.local.get('gold', (possible) => {
                (possible && Object.keys(possible).length && possible.hasOwnProperty('gold'))
                    ? resolve(Gold.fromJson(possible.gold))
                    : resolve(Gold.placeholder());
            });
        })
    }

    /***
     * Removes the instance of Gold.
     * This will delete all user data.
     * @returns {Promise}
     */
    static remove(){
        return new Promise(resolve => {
            apis.storage.local.remove('gold', () => {
                resolve();
            });
        })
    }

    /***
     * Caches an ABI
     * @param contractName
     * @param chainId
     * @param abi
     * @returns {Promise}
     */
    static cacheABI(contractName, chainId, abi){
        return new Promise(resolve => {
            apis.storage.local.set({[`abi:${contractName}:${chainId}`]:abi}, () => {
                resolve(abi);
            });
        });
    }

    /***
     * Fetches an ABI from cache
     * @param contractName
     * @param chainId
     * @returns {Promise}
     */
    static getABI(contractName, chainId){
        return new Promise(resolve => {
            const prop = `abi:${contractName}:${chainId}`;
            apis.storage.local.get(prop, (possible) => {
                if(JSON.stringify(possible) !== '{}') resolve(possible[prop]);
                else resolve('no cache');
            });
        })
    }

    static getSalt(){
        return new Promise(resolve => {
            apis.storage.local.get('salt', (possible) => {
                if(JSON.stringify(possible) !== '{}') resolve(possible.salt);
                else resolve('SALT_ME');
            });
        })
    }

    static setSalt(salt){
        return new Promise(resolve => {
            apis.storage.local.set({salt}, () => {
                resolve(salt);
            });
        })
    }
}