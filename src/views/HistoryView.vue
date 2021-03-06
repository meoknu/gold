<template>
    <section>

        <nav-actions :actions="navActions" v-on:save="exportHistories" v-on:clear="clearHistories"></nav-actions>

        <search v-on:changed="changed => bind(changed, 'searchText')"></search>

        <section class="p20 scroller with-search" v-if="histories.length">
            <section v-for="hist in filterBySearch()" class="panel-box">

                <!-- Header -->
                <section class="panel" style="overflow:hidden;">
                    <figure class="header big">
                        <i class="fa" :class="typeIcon(hist.type)"></i>
                        {{hist.type}}
                    </figure>
                    <figure class="header small margin">
                        <i class="fa fa-globe"></i>
                        {{`${hist.data.network.host}:${hist.data.network.port}`}}
                    </figure>
                    <figure class="header small margin">
                        <figure class="fl black">
                            {{hist.data.domain}}
                        </figure>
                        <figure class="fr">{{hist.timestamp/1000 | moment('from', 'now')}}</figure>
                    </figure>
                </section>

                <!-- Provided Wallet -->
                <section class="panel" v-if="hist.type === historyTypes.PROVIDED_WALLET">
                    <figure class="header small reverse-margin">{{locale(langKeys.GENERIC_Wallet)}}</figure>
                    <section class="items">
                        <section class="item">
                            <span>{{locale(langKeys.GENERIC_Name)}}</span>
                            <span>
                                <router-link :class="{'link':findWallet(hist.data.publicKey)}" :to="(findWallet(hist.data.publicKey)) ?
                                    {name:routeNames.WALLET, query:{hash:findWallet(hist.data.publicKey).publicKey}} : {}">
                                    {{hist.data.walletName}} <i v-if="!findWallet(hist.data.publicKey)">( removed )</i>
                                </router-link>
                            </span>
                        </section>
                    </section>
                </section>

                <!-- Signed Transaction -->
                <section class="panel" v-if="hist.type === historyTypes.SIGNED_TRANSACTION">
                    <figure class="header small reverse-margin">wallet</figure>
                    <section class="items">
                        <section class="item">
                            <span>name</span>
                            <span>
                                <router-link :class="{'link':findWallet(hist.data.publicKey)}" :to="(findWallet(hist.data.publicKey)) ?
                                    {name:routeNames.WALLET, query:{hash:findWallet(hist.data.publicKey).publicKey}} : {}">
                                    {{hist.data.walletName}} <i v-if="!findWallet(hist.data.publicKey)">( {{locale(langKeys.GENERIC_Removed)}} )</i>
                                </router-link>
                            </span>
                        </section>
                        <section v-for="message in hist.data.messages">
                            <section class="item">
                                <span>{{locale(langKeys.GENERIC_Contract)}}</span>
                                <span>{{message.code}}</span>
                            </section>
                            <section class="item">
                                <span>{{locale(langKeys.GENERIC_Action)}}</span>
                                <span>{{message.type}}</span>
                            </section>
                        </section>
                    </section>
                </section>

            </section>
        </section>

        <section class="nothing-here" v-else>
            <figure class="header">{{locale(langKeys.HISTORIES_Header)}}</figure>
            <figure class="sub-header">
                {{locale(langKeys.HISTORIES_Description)}}
                <br><br>
                <figure class="line"></figure>
                <section style="margin-top:10px; font-size:9px;">
                    {{locale(langKeys.HISTORIES_Note)}}
                </section>
            </figure>
        </section>
    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import ObjectHelpers from '../util/ObjectHelpers'
    import Permission from '../models/Permission'
    import * as HistoricEventTypes from '../models/histories/HistoricEventTypes'

    export default {
        data(){ return {
            searchText:'',
            routeNames:RouteNames,
            historyTypes:HistoricEventTypes
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'histories'
            ]),
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            filterBySearch(){ return this.histories.filter(x => JSON.stringify(x).indexOf(this.searchText) > -1) },
            findWallet(hash){ return this.gold.keychain.findWallet(hash); },
            typeIcon(type){
                switch(type){
                    case HistoricEventTypes.SIGNED_TRANSACTION: return 'fa-cubes';
                    case HistoricEventTypes.PROVIDED_WALLET: return 'fa-cube';
                }
                return '';
            },
            navActions(){
                return (this.histories.length) ? [
                    {event:'save', icon:'hdd-o'},
                    {event:'clear', icon:'trash-o'}
                ] : [];
            },
            exportHistories(){

            },
            clearHistories(){

            },
            ...mapActions([
                Actions.UPDATE_STORED_GOLD
            ])
        }
    }
</script>

<style lang="scss">

    .link {
        color:blue;
        text-decoration: underline;
    }

    .fl { float:left; }
    .fr { float:right; }

    .black {
        color:#555;
    }

</style>