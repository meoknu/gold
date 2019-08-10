<template>
    <section class="networks">

        <nav-actions :actions="[
            {event:'create', text:locale(langKeys.GENERIC_New)}
        ]" v-on:create="createKeyPair"></nav-actions>

        <search v-on:changed="changed => bind(changed, 'searchText')"></search>

        <section class="scroller with-search" v-if="keypairs.length">
            <section v-for="keypair in filterBySearch()" class="panel-box">
                <section style="display: flex;justify-content: space-between;font-size: 15px;align-items: center;background-color: #dedede;">
                    <figure style="width: 90px;height: 30px;line-height: 30px;text-align: center;background-color: rgb(230, 230, 230);color: rgb(107, 107, 107);font-size: 17px;font-weight: 700;">EOS</figure>
                    <figure style="width: -webkit-fill-available; font-size: 15px; margin-left: 10px;">My First Key Pair</figure>
                    <figure class="action blue" style="height: 30px;width: 44px;line-height: 30px;text-align: center;color: rgb(255, 255, 255);background-color: rgb(148, 148, 148);" v-on:click="copyKeypair(keypair)"><i class="fa fa-copy"></i></figure>
                    <figure class="action blue" style="height: 30px;width: 44px;line-height: 30px;text-align: center;color: rgb(255, 255, 255);background-color: rgb(252, 142, 142);" v-on:click="deleteKeypair(keypair)"><i class="fa fa-close"></i></figure>
                </section>
                <section>
                    <section>
                        <cin :text="keypair.publicKey" type="text" :disabled="keypair.publicKey"></cin>
                    </section>
                </section>
            </section>
        </section>

        <section class="nothing-here" v-else>
            <figure class="header">{{locale(langKeys.KEYPAIRS_NoKeyPairsHeader)}}</figure>
            <figure class="sub-header">{{locale(langKeys.KEYPAIRS_NoKeyPairsDescription)}}</figure>
        </section>

        <!-- INPUT FIELD USED FOR COPYING -->
        <input tabindex="-1" type="text" ref="copier" class="copier" />
    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import Gold from '../models/Gold'
    import AlertMsg from '../models/alerts/AlertMsg'

    export default {
        data(){ return {
            searchText:''
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'keypairs',
                'identities'
            ])
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            copyKeypair(keypair){
                const copier = this.$refs.copier;
                copier.value = keypair.publicKey;
                copier.select();
                document.execCommand("copy");
            },
            createKeyPair(){ this.$router.push({ name:RouteNames.KEYPAIRS }) },
            filterBySearch(){ return this.keypairs.filter(keypair => JSON.stringify(keypair).indexOf(this.searchText) > -1) },
            deleteKeypair(keypair){
                const usedInIdentities = [];
                this.identities.map(id => {
                    if(id.getAccountFromPublicKey(keypair.publicKey))
                        usedInIdentities.push(id);
                });
                this[Actions.PUSH_ALERT](AlertMsg.DeletingKeyPair(usedInIdentities.map(id => id.name))).then(accepted => {
                    if(!accepted || !accepted.hasOwnProperty('accepted')) return false;

                    const gold = this.gold.clone();
                    if(usedInIdentities.length){
                        usedInIdentities.map(_id => {
                            const id = gold.keychain.identities.find(x => x.publicKey === _id.publicKey)
                            // Remove account from identities
                            Object.keys(id.accounts).map(network => {
                                if(id.accounts[network].publicKey === keypair.publicKey)
                                    id.removeAccount(network);
                            });

                            // Remove permissions
                            gold.keychain.removePermissionsByKeypair(keypair);
                        });
                    }
                    gold.keychain.removeKeyPair(keypair);
                    this[Actions.UPDATE_STORED_GOLD](gold).then(() => {});
                });
            },
            ...mapActions([
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT,
            ])
        }
    }
</script>

<style lang="scss">
    .header {
        &.small {
            display:inline-block;
            margin-right:8px;
        }
    }
    .input {
        input {
            font-size: 11px;
        }
    }
</style>