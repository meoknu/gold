import Vue from 'vue'
import Vuex from 'vuex';

import {mutations} from './mutations';
import {actions} from './actions';
import * as LANG_KEYS from '../localization/keys';

import {WalletRequiredFields} from '../models/Wallet'

Vue.use(Vuex);

const state = {
    gold:null,
    mnemonic:null,

    alerts:[],
    alertResult:null,

    prompt:null,
};

const getters = {
    meta:state => state.gold.meta,
    wallets:state => state.gold.keychain.wallets,
    permissions:state => state.gold.keychain.permissions,
    keypairs:state => state.gold.keychain.keypairs,
    networks:state => state.gold.settings.networks,
    histories:state => state.gold.histories,
    autoLockInterval:state => state.gold.settings.inactivityInterval,
    language:state => state.gold.settings.language,

    // FOR PROMPTS ONLY
    walletFields:state => WalletRequiredFields.fromJson(state.prompt.data),
    requiredFields:state => WalletRequiredFields.fromJson(state.prompt.data.requiredFields || {}),
    messages:state => state.prompt.data.messages || [],
};

export const store = new Vuex.Store({
    state,
    getters,
    mutations,
    actions
})