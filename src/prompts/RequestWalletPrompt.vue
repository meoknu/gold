<template>
    <section class="prompt-body">

        <section class="partitioned">

            <section class="partition">

                <section v-if="!walletFields.isEmpty()">
                    <section class="description">
                        <b>{{prompt.domain}}</b> {{locale(langKeys.REQUEST_Wallet)[0]}}
                    </section>

                    <section class="key-value">
                        <figure class="key">{{locale(langKeys.GENERIC_Requires)}}</figure>
                        <figure class="value" v-for="field in walletFields.personal">
                            {{field}}
                        </figure>
                        <figure class="value" v-for="field in walletFields.location">
                            {{field}}
                        </figure>
                        <figure class="value" v-for="account in walletFields.accounts">
                            {{account.blockchain.toUpperCase()}} {{locale(langKeys.GENERIC_Account)}}
                        </figure>
                    </section>

                    <section class="description">{{locale(langKeys.REQUEST_Wallet)[1]}}</section>
                    <section class="description">{{locale(langKeys.REQUEST_Wallet)[2]}}</section>
                </section>

                <section v-else>
                    <section class="description"><b>{{prompt.domain}}</b> {{locale(langKeys.REQUEST_Wallet)[3]}}</section>
                </section>

            </section>

            <search v-on:changed="changed => bind(changed, 'searchText')" v-if="filteredWallets().length"></search>

            <section class="partition scroller" v-if="filteredWallets().length">


                <section v-for="wallet in filteredWallets()" class="panel-box">

                    <!-- Header -->
                    <section class="panel">
                        <figure class="header big wallet-header">{{wallet.name}}</figure>
                        <figure class="select-wallet"
                                v-on:click="selectWallet(wallet)"
                                :class="{'selected':selectedWallet && selectedWallet.publicKey === wallet.publicKey}">
                            {{locale(langKeys.BUTTON_SelectWallet)}}
                        </figure>
                        <!--<figure class="header small margin"><i class="fa fa-globe"></i>{{wallet.network.host}}</figure>-->
                    </section>

                    <section class="panel" v-if="!walletFields.isEmpty()">
                        <figure class="header small reverse-margin">{{locale(langKeys.GENERIC_RequiredProperties)}}</figure>
                        <section class="panel inner" v-for="key in Object.keys(walletFields)" v-if="walletFields[key].length">
                            <figure class="header small reverse-margin">{{key}}</figure>
                            <section class="items">
                                <section class="item" v-for="prop in walletFields[key]">
                                    <figure>
                                        <span>{{formatProp(prop)}}</span>
                                        <span>{{formatPropValue(wallet, prop)}}</span>
                                    </figure>
                                </section>
                            </section>
                        </section>

                    </section>

                </section>

            </section>

            <section class="partition" v-else>
                <section class="nothing-here">
                    <figure class="header"><b>{{locale(langKeys.REQUEST_WalletNoWallets)[0]}}</b></figure>
                    <figure class="sub-header">{{locale(langKeys.REQUEST_WalletNoWallets)[1]}}</figure>
                </section>
            </section>

        </section>

        <section class="prompt-actions" v-if="filteredWallets().length">
            <btn :text="locale(langKeys.BUTTON_Deny)" half="true" v-on:clicked="denied"></btn>
            <btn :text="locale(langKeys.BUTTON_Accept)" half="true" is-blue="true" v-on:clicked="accepted"></btn>
        </section>

        <section class="prompt-actions" v-else>
            <btn :text="locale(langKeys.BUTTON_Cancel)" v-on:clicked="denied"></btn>
        </section>

    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import AlertMsg from '../models/alerts/AlertMsg'
    import WalletService from '../services/WalletService'
    import NotificationService from '../services/NotificationService'
    import Wallet from '../models/Wallet'
    import Network from '../models/Network'
    import PluginRepository from '../plugins/PluginRepository'

    export default {
        data(){ return {
            searchText:'',
            selectedWallet:null,
        }},
        computed: {
            ...mapState([
                'gold',
                'prompt'
            ]),
            ...mapGetters([
                'wallets',
                'walletFields'
            ])
        },
        mounted(){
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            filteredWallets(){
                return this.wallets
                    .filter(id => id.hasRequiredFields(this.walletFields))
                    .filter(id => JSON.stringify(id).indexOf(this.searchText) !== -1)
            },
            formatProp(prop){
                if(prop instanceof Network) return `${prop.blockchain.toUpperCase()} Account`;
                return prop;
            },
            formatPropValue(wallet, prop){
                const value = wallet.getPropertyValueByName(prop);
                if(prop instanceof Network) return PluginRepository.plugin(prop.blockchain).accountFormatter(value);
                else if (prop === 'country') return value.name;
                return value;
            },
            selectWallet(wallet){
                this.selectedWallet = wallet;
            },
            accepted(){
                if(!this.selectedWallet){
                    this[Actions.PUSH_ALERT](AlertMsg.YouMustSelectAnWallet());
                    return false;
                }
                const wallet = this.wallets.find(id => id.publicKey === this.selectedWallet.publicKey);
                this.prompt.responder(wallet);
                NotificationService.close();
            },
            denied(){
                this.prompt.responder(null);
                NotificationService.close();
            },
            ...mapActions([
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT,
                Actions.PUSH_PROMPT
            ])
        }
    }
</script>

<style lang="scss">
    span {

        .red {

        }
    }
    .prompt-body {
        padding: 0 20px;
        font-family: 'Open Sans', sans-serif;

        .wallet-header {
            width:calc(100% - 98px);
            display:inline-block;
        }

        .select-wallet {
            cursor: pointer;
            padding:0 10px;
            height:24px;
            line-height:21px;
            display:inline-block;
            color:#bebebe;
            font-family: 'Open Sans', sans-serif;
            font-size: 11px;
            border:1px solid #dfdfdf;
            border-radius: 4px;
            transition:all 0.2s ease;
            transition-property: background, border, color;

            &:hover, &.selected {
                background:#54a7fc;
                border:1px solid #54a7fc;
                color:#fff;
            }
        }

        .description {
            margin-top:5px;
            font-size:13px;
            color:rgba(0,0,0,0.8);

            b { color:#54a7fc; }
        }

        .partitioned {
            overflow:hidden;
            height:365px;
            width:100%;
            margin-bottom: 10px;

            .partition {
                // width:50%;
                // float:left;
                // height:385px;
                overflow-y:auto;
                position: relative;
                display:block;

                &.scroller {
                    // height:405px;
                    height:auto;
                }

                &:first-child {
                    padding:20px;
                    // padding:40px 50px;

                    .key-value {
                        padding:20px;
                        border:2px dashed rgba(0,0,0,0.05);
                        border-radius: 4px;
                        margin-bottom:20px;
                        margin-top:20px;

                        .key {
                            font-size:9px;
                            color:#bbbbbb;
                        }

                        .value {
                            font-size:12px;
                            color:#707070;
                            font-weight:900;
                            font-style: italic;
                        }
                    }
                }

                &:last-child {
                    background:#f5f5f5;
                    padding:20px;
                }
            }
        }
    }
</style>