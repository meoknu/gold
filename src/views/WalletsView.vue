<template>
    <section class="wallets">

        <nav-actions :actions="[
            {event:'create', text:locale(langKeys.GENERIC_New)}
        ]" v-on:create="createWallet"></nav-actions>

        <search v-on:changed="changed => bind(changed, 'searchText')"></search>

        <section v-if="!wallets.length" class="nothing-here">

            <figure class="header">
                {{locale(langKeys.WALLETS_Header)}}
            </figure>
            <figure class="sub-header">
                {{locale(langKeys.WALLETS_Description)}}
                <br><br>
                <btn :text="locale(langKeys.BUTTON_CreateWallet)" v-on:clicked="createWallet" margined="true"></btn>
            </figure>

        </section>
        <section v-if="wallets.length" class="scroller with-search">
            <!-- <section v-for="wallet in filterBySearch()" class="panel-box">
                <section class="items" v-for="network in Object.keys(wallet.accounts)">
                    <section style="display: flex;justify-content: space-between;font-size: 15px;align-items: center;background-color: #dedede;">
                        <figure style="min-width: 90px;height: 30px;line-height: 30px;text-align: center;background-color: rgb(230, 230, 230);color: rgb(107, 107, 107);font-size: 11px;font-weight: 700;white-space: nowrap;">{{networkToName(network)}}</figure>
                        <figure style="width: -webkit-fill-available; font-size: 15px; margin-left: 10px;">{{wallet.accounts[network].formatted()}}</figure>
                        <figure class="action blue" style="height: 30px;width: 44px;line-height: 30px;text-align: center;color: rgb(255, 255, 255);background-color: rgb(148, 148, 148);"><i class="fa fa-copy"></i></figure>
                        <figure class="action blue" style="height: 30px;width: 44px;line-height: 30px;text-align: center;color: rgb(255, 255, 255);background-color: rgb(252, 142, 142);"><i class="fa fa-close"></i></figure>
                    </section>
                    <section>
                        <section>
                            <cin type="text" ></cin>
                        </section>
                    </section>
                </section>
            </section> -->
            <section v-for="wallet in filterBySearch()" class="panel-box">
                <section class="panel">
                    <figure class="header big">{{wallet.name}}</figure>
                </section>
                <section class="panel" v-if="Object.keys(wallet.accounts).length">
                    <!-- <figure class="header small reverse-margin">accounts</figure> -->
                    <section class="items" v-for="network in Object.keys(wallet.accounts)">
                        <section class="item">
                            <span>{{networkToName(network)}}</span>
                            <span>{{wallet.accounts[network].formatted()}}</span>
                            <section class="items token-balances" v-if="loadingTokenBalances && loadingTokenBalances === wallet.publicKey">
                                <section class="item">
                                    Loading token balances
                                </section>
                            </section>
                            <section class="items token-balances" v-else v-for="bals in balancesFor(wallet)">
                                <section class="items" v-for="balance in bals">
                                    <section class="item">
                                        <span>{{balance[0]}}</span>
                                        <span>{{balance[1]}}</span>
                                    </section>
                                </section>
                            </section>
                        </section>
                    </section>
                </section>

                <!-- Personal Information -->
                <!-- <section class="panel" v-if="fullKeysOf(wallet.personal).length">
                    <figure class="header small reverse-margin">personal information</figure>
                    <section class="items">
                        <section class="item" v-for="key in fullKeysOf(wallet.personal)">
                            <span>{{key}}</span>
                            <span>{{wallet.personal[key]}}</span>
                        </section>
                    </section>
                </section> -->

                <!-- Location Information -->
                <!-- <section class="panel" v-for="location in wallet.locations">
                    <section v-if="fullKeysOf(location).length">
                        <figure class="header small reverse-margin">location information</figure>
                        <section class="items">
                            <section class="item" v-for="key in fullKeysOf(location)">
                                <span>{{key}}</span>
                                <span v-if="key === 'country'">{{location[key].name}}</span>
                                <span v-else>{{location[key]}}</span>
                            </section>
                        </section>
                    </section>
                </section> -->

                <!-- Actions -->
                <section class="panel">
                    <section class="actions">
                        <figure v-on:click="goToWallet(wallet)" class="action"><i class="fa fa-pencil"></i></figure>
                        <section v-if="Object.keys(wallet.accounts).length">
                            <figure class="action" @click="showingTokens = wallet" v-if="!showingTokensFor(wallet)"><i class="fa fa-circle-thin"></i></figure>
                            <figure class="action" @click="showingTokens = null" v-else><i class="fa fa-times-circle"></i></figure>
                        </section>
                        <figure class="action red right" v-on:click="removeWallet(wallet)"><i class="fa fa-close"></i></figure>
                    </section>
                </section>

            </section>
        </section>
    </section>
</template>

<script>
    import Vue from 'vue'
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import Wallet from '../models/Wallet'
    import Network from '../models/Network'
    import Gold from '../models/Gold'
    import AlertMsg from '../models/alerts/AlertMsg'
    import ObjectHelpers from '../util/ObjectHelpers'
    import AccountService from '../services/AccountService'
    import PluginRepository from '../plugins/PluginRepository'

    export default {
        data(){ return {
            searchText:'',
            balances:[],
            showingTokens:null,
            loadingTokenBalances:null,
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'wallets',
            ])
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            fullKeysOf(obj){ return Object.keys(obj).filter(key => {
                switch(typeof obj[key]){
                    case 'string': return obj[key].length;
                    case 'boolean': return true;
                    default: return obj[key][Object.keys(obj[key])[0]].length;
                }
            }) },
            showingTokensFor(wallet){
                return this.showingTokens && (wallet.publicKey === this.showingTokens.publicKey);
            },
            async bindBalances(wallet){
                this.loadingTokenBalances = wallet.publicKey;
                let netAccountMap = [];
                Object.keys(wallet.accounts).map(netString =>
                    netAccountMap.push({account:wallet.accounts[netString], netString}));

                netAccountMap = ObjectHelpers.distinct(netAccountMap);

                await Promise.all(netAccountMap.map(async netAccount => {
                    await this.accountBalances(netAccount, wallet);
                }));

                this.loadingTokenBalances = null;
            },
            async accountBalances({account, netString}, wallet){
                let network = Network.fromUnique(netString);

                if(!network.host){
                    const hostedNetwork = this.gold.settings.networks.find(n => n.chainId === network.chainId && n.host !== '');
                    if(!hostedNetwork) return false;
                    network = hostedNetwork;
                }

                await PluginRepository.plugin(account.blockchain()).getBalances(account, network).then(balances => {
                    let idpkref = this.balances.find(bal => bal.idpk === wallet.publicKey);
                    if(!idpkref){
                       this.balances.push({idpk:wallet.publicKey, balances:[]});
                       idpkref = this.balances.find(bal => bal.idpk === wallet.publicKey);
                    }

                    idpkref.balances.push({network:netString, balances});
                    return true;
                });
            },
            balancesFor(wallet){
                const walletBalances = this.balances.find(balances => balances.idpk === wallet.publicKey);
                if(!walletBalances) return [];
                return walletBalances.balances.map(b => b.balances);
            },
            filterBySearch(){ return this.wallets.filter(x => JSON.stringify(x).indexOf(this.searchText) > -1) },
            removeWallet(wallet){
                this[Actions.PUSH_ALERT](AlertMsg.RemovingWallet(wallet.name)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    const gold = this.gold.clone();
                    gold.keychain.wallets = gold.keychain.wallets.filter(id => id.publicKey !== wallet.publicKey);
                    gold.keychain.permissions = gold.keychain.permissions.filter(perm => perm.wallet !== wallet.publicKey);
                    this[Actions.UPDATE_STORED_GOLD](gold);
                });

            },
            goToWallet(wallet){
                this.$router.push({ name:RouteNames.WALLET, query: { publicKey: wallet.publicKey } })
            },
            createWallet(){
                this.$router.push({ name:RouteNames.WALLET, query: { publicKey: 'create' } })
            },
            networkToName(_network){
                const network = this.gold.settings.networks.find(network => network.unique() === _network);
                if(!network) return 'Deleted Network';
                return network.hasOwnProperty('name') && network.name.length ? network.name : network.unique();
            },
            ...mapActions([
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT,
            ])
        },
        watch:{
            showingTokens(){
                this.balances = [];
                if(this.showingTokens)
                    this.bindBalances(this.showingTokens)
            }
        }
    }
</script>

<style lang="scss">

    .token-balances {
        display: inline-block;
        border-left: 10px solid rgba(0,0,0,0.1);
        width: 100%;
        padding: 0 0 0 5px;

        .items {
            margin-top:0 !important;
        }
    }

</style>