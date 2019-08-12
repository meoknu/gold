import * as Actions from './constants'
import Hasher from '../util/Hasher'
import Mnemonic from '../util/Mnemonic'
import Gold from '../models/Gold'
import Wallet from '../models/Wallet'
import Meta from '../models/Meta'
import Network from '../models/Network'
import InternalMessage from '../messages/InternalMessage'
import * as InternalMessageTypes from '../messages/InternalMessageTypes'
import PluginRepository from '../plugins/PluginRepository'
import RIDLService from '../services/RIDLService'
import StorageService from '../services/StorageService'
import IdGenerator from '../util/IdGenerator'
import ridl from 'ridl';

export const actions = {
    [Actions.SET_GOLD]:({commit}, gold) => commit(Actions.SET_GOLD, gold),
    [Actions.SET_MNEMONIC]:({commit}, mnemonic) => commit(Actions.SET_MNEMONIC, mnemonic),
    [Actions.IS_UNLOCKED]:() => InternalMessage.signal(InternalMessageTypes.IS_UNLOCKED).send(),
    [Actions.LOCK]:() => InternalMessage.payload(InternalMessageTypes.SET_SEED, '').send(),
    [Actions.DESTROY]:({dispatch}) => InternalMessage.signal(InternalMessageTypes.DESTROY).send(),

    [Actions.SET_SEED]:({commit}, password) => {
        return new Promise(async (resolve, reject) => {
            let seed, mnemonic;
            if(password.split(' ').length >= 12) {
                seed = await Mnemonic.mnemonicToSeed(password);
                mnemonic = password;
            } else {
                const [m, s] = await Mnemonic.generateMnemonic(password);
                seed = s;
                mnemonic = m;
            }

            InternalMessage.payload(InternalMessageTypes.SET_SEED, seed).send().then(() => {
                resolve(mnemonic)
            })
        })
    },

    [Actions.SET_AUTO_LOCK]:({commit}, timeoutMinutes) => {
        return new Promise((resolve, reject) => {
            commit(Actions.SET_AUTO_LOCK, timeoutMinutes);
            InternalMessage.payload(InternalMessageTypes.SET_TIMEOUT, timeoutMinutes).send().then(() => {
                resolve(timeoutMinutes)
            })
        })
    },

    [Actions.LOAD_GOLD]:({dispatch}) => {
        return new Promise((resolve, reject) => {
            InternalMessage.signal(InternalMessageTypes.LOAD).send().then(_gold => {
                dispatch(Actions.SET_GOLD, Gold.fromJson(_gold));
                resolve();
            })
        })
    },

    [Actions.UPDATE_STORED_GOLD]:({dispatch}, gold) => {
        return new Promise((resolve, reject) => {
            InternalMessage.payload(InternalMessageTypes.UPDATE, gold).send().then(_gold => {
                dispatch(Actions.SET_GOLD, Gold.fromJson(_gold));
                resolve(_gold)
            })
        })
    },

    [Actions.IMPORT_GOLD]:({dispatch}, {imported, seed}) => {
        return new Promise(async (resolve, reject) => {

            const gold = Gold.fromJson(imported);

            gold.settings.hasEncryptionKey = true;

            const networkUniques = gold.settings.networks.map(network => network.unique());
            await Promise.all(PluginRepository.signatureProviders().map(async plugin => {
                const network = await plugin.getEndorsedNetwork();

                gold.settings.networks = gold.settings.networks.filter(_network => _network.unique() !== network.unique());
                gold.settings.networks.push(network);
            }));

            gold.meta = new Meta();

            InternalMessage.payload(InternalMessageTypes.SET_SEED, seed).send().then(() => {
                dispatch(Actions.UPDATE_STORED_GOLD, gold).then(_gold => {
                    resolve();
                })
            });
        })
    },

    [Actions.CREATE_NEW_GOLD]:({state, commit, dispatch}, password) => {
        return new Promise(async (resolve, reject) => {
            const gold = Gold.fromJson(state.gold);
            gold.settings.hasEncryptionKey = true;
            await Promise.all(PluginRepository.signatureProviders().map(async plugin => {
                const network = await plugin.getEndorsedNetwork();
                gold.settings.networks.push(network);
            }));


            const firstWallet = Wallet.placeholder();
            await firstWallet.initialize(gold.hash);
            const identified = await RIDLService.identify(firstWallet.publicKey);
            if(identified) {
                firstWallet.name = identified;
                gold.keychain.updateOrPushWallet(firstWallet);
            }

            await StorageService.setSalt(Hasher.insecureHash(IdGenerator.text(32)));

            dispatch(Actions.SET_SEED, password).then(mnemonic => {
                dispatch(Actions.UPDATE_STORED_GOLD, gold).then(_gold => {
                    dispatch(Actions.SET_MNEMONIC, mnemonic);
                    dispatch(Actions.SET_GOLD, Gold.fromJson(_gold));
                    resolve();
                })
            })
        })
    },

    [Actions.SIGN_RIDL]:({commit}, {hash, publicKey}) => {
        return new Promise(async (resolve, reject) => {
            InternalMessage.payload(InternalMessageTypes.PUB_TO_PRIV, publicKey).send().then(privateKey => {
                if(!privateKey) return resolve(null);
                resolve(ridl.sign(hash, privateKey));
            });
        })
    },




    [Actions.PUSH_ALERT]:({state, commit}, error) => {
        function waitForErrorResult(resolve){
            if(state.alertResult) {
                const alertResult = Object.assign({}, state.alertResult);
                commit(Actions.CLEAR_ALERT_RESULT);
                resolve(alertResult)
            } else setTimeout(() => {
                waitForErrorResult(resolve);
            }, 100)
        }

        return new Promise((resolve, reject) => {
            commit(Actions.PUSH_ALERT, error);
            waitForErrorResult(resolve);
        })
    },
    [Actions.PULL_ALERT]:({commit}) => commit(Actions.PULL_ALERT),
    [Actions.PUSH_ALERT_RESULT]:({commit}, alertResult) => commit(Actions.PUSH_ALERT_RESULT, alertResult),
    [Actions.CLEAR_ALERT_RESULT]:({commit}) => commit(Actions.CLEAR_ALERT_RESULT),


    [Actions.PUSH_PROMPT]:({state, commit}, prompt) => {
        if(state.prompt) state.prompt.responder(null);
        commit(Actions.PUSH_PROMPT, prompt);
    },
};