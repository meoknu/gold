<template>
    <section class="domain-permissions">

        <search v-on:changed="changed => bind(changed, 'searchText')" :placeholder="'Search: ' + domain"></search>

        <section class="p20 scroller with-search">
            <section v-for="(domainPermissions, hash) in filterBySearch()" class="panel-box">

                <!-- Account Information -->
                <section class="panel">
                    <figure class="header big wallet-header">{{domainPermissions.find(perm => perm.isWalletOnly()).getWallet(gold.keychain).name}}</figure>
                    <figure class="revoke-wallet" v-on:click="revoke({type:'wallet', perm:domainPermissions.find(perm => perm.isWalletOnly())})">
                        {{locale(langKeys.PERMISSION_RevokeWallet)}}
                    </figure>
                    <figure class="header small margin" style="overflow:hidden;">
                        <figure style="float:left;">
                            <i class="fa fa-globe"></i>
                            {{domainPermissions.find(perm => perm.isWalletOnly()).network.host}}
                        </figure>
                        <figure style="float:right">
                            {{domainPermissions.find(perm => perm.isWalletOnly()).timestamp/1000 | moment('from', 'now')}}
                        </figure>
                    </figure>
                </section>

                <!-- Contract Permissions -->
                <section class="panel" v-for="(actions, contract) in groupByContract(domainPermissions)">
                    <figure class="header contract-header">{{actions[0].contract}}</figure>
                    <figure class="revoke-contract-actions" v-on:click="revoke({type:'contract', contract, network:actions[0].network})">
                        {{locale(langKeys.PERMISSION_RevokeContract)}}
                    </figure>
                    <section class="items">
                        <section class="item" v-for="action in actions">
                            <span><u><b>{{action.action}}</b></u> <i>( {{action.timestamp/1000 | moment('from', 'now')}} )</i></span>
                            <span class="revoke-text" v-on:click="revoke({type:'action', perm:action})">
                                {{locale(langKeys.PERMISSION_RevokeAction)}}
                            </span>

                            <section class="item" v-for="field in action.mutableFields">
                                <span>{{locale(langKeys.GENERIC_Ignored)}}</span>
                                <span><b>{{field}}</b></span>
                            </section>
                        </section>
                    </section>
                </section>

            </section>
        </section>
    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import Gold from '../models/Gold'
    import Permission from '../models/Permission'
    import AlertMsg from '../models/alerts/AlertMsg'
    import ObjectHelpers from '../util/ObjectHelpers'

    export default {
        data(){ return {
            searchText:'',
            domain:this.$route.query.domain.toLowerCase() || '',
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'permissions'
            ])
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            groupByWallet(permissions){ return ObjectHelpers.groupBy(permissions.filter(x => x.domain.toLowerCase() === this.domain), 'publicKey'); },
            groupByContract(permissions){ return ObjectHelpers.groupBy(permissions.filter(perm => perm.isContractAction()), 'contract'); },

            filterBySearch(){
                return Object.keys(this.groupByWallet(this.permissions))
                    .filter(x => JSON.stringify(x).indexOf(this.searchText) > -1)
                    .reduce((acc,key) => {
                        acc[key] = this.groupByWallet(this.permissions)[key];
                        return acc;
                    }, {})
            },

            /***
             * Revokes an Wallet, contract or action
             * @param revokeObject
             */
            revoke(revokeObject){
                switch(revokeObject.type){
                    case 'wallet':this.removeWalletPermissions(revokeObject.perm); break;
                    case 'contract': this.removeContractPermissions(revokeObject.contract, revokeObject.network); break;
                    case 'action': this.removeActionPermissions(revokeObject.perm); break;
                }
            },

            /***
             * Removes an Wallet's permissions from a Domain and Network
             * @param permission
             */
            removeWalletPermissions(permission){
                const gold = this.gold.clone();
                this[Actions.PUSH_ALERT](AlertMsg.RevokingWallet(this.domain)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    gold.keychain.permissions = gold.keychain.permissions.filter(perm =>
                        perm.network.unique() !== permission.network.unique() ||
                        perm.domain !== permission.domain ||
                        perm.wallet !== permission.wallet);
                    this[Actions.UPDATE_STORED_GOLD](gold).then(() => this.goBackIfEmpty());
                });
            },

            /***
             * Removes a contract's permissions by removing all actions associated with it under an Wallet and Network
             * @param contract
             * @param network
             */
            removeContractPermissions(contract, network){
                const gold = this.gold.clone();
                this[Actions.PUSH_ALERT](AlertMsg.RevokingContract(this.domain)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    gold.keychain.permissions = gold.keychain.permissions.filter(perm =>
                        perm.network.unique() !== network.unique() ||
                        perm.domain !== this.domain ||
                        perm.contract !== contract);
                    this[Actions.UPDATE_STORED_GOLD](gold);
                });
            },

            /***
             * Removes only a single action from a contract under an Wallet and Network
             * @param permission
             */
            removeActionPermissions(permission){
                const gold = this.gold.clone();
                this[Actions.PUSH_ALERT](AlertMsg.RevokingContractAction(this.domain)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    gold.keychain.permissions = gold.keychain.permissions
                        .filter(perm => JSON.stringify(perm) !== JSON.stringify(permission));
                    this[Actions.UPDATE_STORED_GOLD](gold);
                });
            },

            goBackIfEmpty(){
                if(!Object.keys(this.groupByWallet(this.permissions)).length) this.$router.back();
            },

            ...mapActions([
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT,
            ])
        }
    }
</script>

<style lang="scss">

    .domain-permissions {

        .wallet-header {
            width:calc(100% - 104px);
            display:inline-block;
        }

        .revoke-wallet {
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

            &:hover {
                background:#ff0d0c;
                border:1px solid #ff0d0c;
                color:#fff;
            }
        }

        .contract-header {
            width:calc(100% - 91px);
            display:inline-block;
        }

        .revoke-contract-actions {
            cursor: pointer;
            padding:0 10px;
            height:15px;
            line-height:11px;
            display:inline-block;
            color:#bebebe;
            font-family: 'Open Sans', sans-serif;
            font-size: 9px;
            border:1px solid #dfdfdf;
            border-radius: 4px;
            transition:all 0.2s ease;
            transition-property: background, border, color;

            &:hover {
                background:#ff0d0c;
                border:1px solid #ff0d0c;
                color:#fff;
            }
        }

        .revoke-text {
            cursor: pointer;
            transition:all 0.2s ease;
            transition-property: color;
            text-decoration: underline;

            &:hover {
                color:#ff0d0c;
            }
        }
    }

</style>