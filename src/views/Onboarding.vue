<template>
    <section>

        <section v-if="step == 0">
            <section class="white-bg">
                <figure class="title">Welcome to Gold!</figure>
                <figure class="breaker"></figure>
                <figure class="description">
                    The Gold team holds no liability towards your digital assets. It is your responsibility to constantly make sure your
                    computer is free of malware. We have taken every measure in our capabilities to ensure that Gold is safe to use
                    as intended however your computer itself is your worst enemy and should be treated as such.
                    <br><br>
                    By using Gold you are relinquishing any ability to take legal actions against the Gold team
                    and recognize yourself as the sole legal owner of your own Gold instance, your keys, and your data.
                </figure>
            </section>
            <section class="p20">
                <btn text="Start Basic Setup" :is-blue="true" v-on:clicked="stepToKeypair" margined="true"></btn>
                <btn text="Skip Basic Setup" :is-red="true" v-on:clicked="finished" margined="true"></btn>
            </section>
        </section>

        <section v-if="step == 1">
            <section class="white-bg">
                <figure class="title">Import Key Pair</figure>
                <figure class="breaker"></figure>
                <figure class="description">
                    Gold supports multiple blockchains. When you enter your Key Pair we will determine which
                    one you are using and set up your Identity for you.
                </figure>
            </section>
            <section class="p20">

                <cin :placeholder="locale(langKeys.PLACEHOLDER_Name)" :text="keypair.name" v-on:changed="changed => bind(changed, 'keypair.name')"></cin>
                <cin :placeholder="locale(langKeys.PLACEHOLDER_PublicKey)" :disabled="true" :text="keypair.publicKey" v-on:changed="changed => bind(changed, 'keypair.publicKey')"></cin>
                <cin type="password" :placeholder="locale(langKeys.PLACEHOLDER_PrivateKey)" @changed="makePublicKey" :text="keypair.privateKey" v-on:changed="changed => bind(changed, 'keypair.privateKey')"></cin>

                <btn :text="`Import ${keypair.blockchain.toUpperCase()} Key Pair`" v-on:clicked="saveKeyPair" :is-blue="true" margined="true"></btn>
                <btn text="No Blockchain" :is-red="true" v-on:clicked="finished" margined="true"></btn>
            </section>
        </section>

        <section v-if="step == 2">
            <section class="white-bg">
                <figure class="title">That's it!</figure>
                <figure class="breaker"></figure>
                <figure class="description">
                    You now have a Gold Identity with an {{keypair.blockchain.toUpperCase()}} account linked to it.
                    <br><br>
                    You can go to your Identity and fill out any extra fields applications might want from you, but none of the fields in your
                    Identity are mandatory.
                    <br><br>
                    Enjoy using Gold.
                </figure>
            </section>
            <section class="p20">
                <btn text="Main Menu" :is-blue="true" v-on:clicked="finished" margined="true"></btn>
            </section>
        </section>



    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import KeyPair from '../models/KeyPair'
    import Network from '../models/Network'
    import Gold from '../models/Gold'
    import AlertMsg from '../models/alerts/AlertMsg'
    import IdentityService from '../services/IdentityService'
    import {BlockchainsArray, Blockchains} from '../models/Blockchains';
    import KeyPairService from '../services/KeyPairService'
    import AccountService from '../services/AccountService'

    export default {
        data(){ return {
            step:0,
            identity:null,
            keypair:KeyPair.fromJson({name:'My First Key Pair'})
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'networks'
            ])
        },
        mounted(){
            this.identity = this.gold.keychain.identities[0];
        },
        methods: {
            bind(changed, dotNotation) {
                let props = dotNotation.split(".");
                const lastKey = props.pop();
                props.reduce((obj,key)=> obj[key], this)[lastKey] = changed.trim();
            },
            stepToKeypair(){
                if(this.gold.keychain.keypairs.length) this.step = 2;
                else this.step = 1;
            },
            async makePublicKey(){
                await KeyPairService.makePublicKey(this.keypair);
                if(!this.keypair.publicKey.length) return this[Actions.PUSH_ALERT](AlertMsg.InvalidPrivateKey());
            },
            async saveKeyPair(){
                if(!this.keypair.publicKey.length) return this[Actions.PUSH_ALERT](AlertMsg.InvalidPrivateKey());
                if(await this.importAccount()) KeyPairService.saveKeyPair(this.keypair, this, () => {
                    const gold = this.gold.clone();
                    gold.keychain.updateOrPushIdentity(this.identity);
                    this[Actions.UPDATE_STORED_GOLD](gold).then(() => this.step++);
                })
            },
            async importAccount(){
                const selectedKeypair = this.keypair;
                const selectedNetwork = this.gold.settings.networks.find(network => network.blockchain === selectedKeypair.blockchain);
                if(!selectedKeypair || !selectedKeypair.publicKey.length) return false;
                return await AccountService.importFromKey(selectedKeypair, selectedNetwork, this).then(imported => {
                    if(!imported.account) return false;
                    this.identity.setAccount(selectedNetwork, imported.account);
                    return true;
                }).catch(() => false);
            },
            finished(){
                const gold = this.gold.clone();
                gold.meta.acceptedTerms = true;
                this[Actions.UPDATE_STORED_GOLD](gold).then(() => this.step++);
                this.$router.push({name:RouteNames.MAIN_MENU});
            },
            ...mapActions([
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT
            ])
        }
    }
</script>

<style lang="scss">
</style>