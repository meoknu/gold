<template>
    <section class="wallet scroller" v-if="wallet">

        <nav-actions :actions="[
            {event:'submit', text:locale(langKeys.GENERIC_Save)}
        ]" v-if="!saving" v-on:submit="saveWallet"></nav-actions>

        <!-- Disabling -->
        <!-- <section class="panel" style="background:#fff;" v-if="!isNew">
            <figure class="header">{{locale(langKeys.WALLET_DisablingHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.WALLET_DisablingDescription)}}</figure>
        </section> -->

        <!-- Wallet Name -->
        <section class="panel">
            <figure class="header">{{locale(langKeys.WALLET_NameHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.WALLET_NameDescription)}}</figure>
            <cin v-if="wallet.ridl > 0 || !registeringWallet" :text="wallet.name" v-on:changed="changed => bind(changed, 'wallet.name')"></cin>
            <cin v-else :placeholder="locale(langKeys.PLACEHOLDER_Name)" :text="newName" v-on:changed="changed => bind(changed, 'newName')"></cin>
            <!--<section v-if="wallet.ridl <= 0">-->
                <!--<btn v-if="!isNew && !registeringWallet"-->
                     <!--:text="registeringWallet ? locale(langKeys.BUTTON_RegisterWallet) : locale(langKeys.BUTTON_ChangeName)"-->
                     <!--v-on:clicked="registerWallet" :is-blue="registeringWallet" margined="true"></btn>-->

                <!--<btn v-if="!isNew && registeringWallet"-->
                     <!--:text="locale(langKeys.BUTTON_ClaimWallet)"-->
                     <!--v-on:clicked="claimWallet" is-blue="true" margined="true"></btn>-->

                <!--<btn v-if="!isNew && registeringWallet"-->
                     <!--:text="locale(langKeys.BUTTON_Cancel)"-->
                     <!--v-on:clicked="registeringWallet = false" margined="true" :is-red="true"></btn>-->
            <!--</section>-->
        </section>

        <!-- Account -->
        <section class="panel" v-if="keypairs.length">
            <figure class="header">{{locale(langKeys.WALLET_AccountHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.WALLET_AccountDescription)}}</figure>

            <sel :disabled="importing" :selected="networks[0]" :options="networks" :parser="(network) => network.name.length ? network.name : network.unique()" v-on:changed="selectNetwork"></sel>

            <cin :disabled="importing"
                 v-if="wallet.networkedAccount(selectedNetwork)"
                 :tag="wallet.networkedAccount(selectedNetwork).name"
                 :text="wallet.networkedAccount(selectedNetwork).name"
                 v-on:untagged="removeAccount"></cin>

            <sel v-if="!wallet.networkedAccount(selectedNetwork)"
                 :disabled="importing"
                 :selected="noKeypair"
                 :options="filteredKeypairs()"
                 :parser="keypair => keypair.name"
                 v-on:changed="selectKeypair"></sel>

            <btn :disabled="importing || !selectedKeypair || !selectedKeypair.publicKey.length"
                 :text="locale(langKeys.GENERIC_Import)"
                 v-on:clicked="importAccount" margined="true"></btn>
        </section>

        <!-- NO KEY PAIRS -->
        <section class="panel" v-else>
            <figure class="header">{{locale(langKeys.WALLET_NoKeyPairsHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.WALLET_NoKeyPairsDescription)}}{{locale(langKeys.SETTINGSMENU_Keypairs)}}</figure>
        </section>

        <!-- Personal Information -->
        <!-- <section class="panel">
            <figure class="header">{{locale(langKeys.WALLET_PersonalHeader)}}</figure>
            <figure class="sub-header" style="margin-bottom:0;">{{locale(langKeys.WALLET_PersonalDescription)}}</figure>

            <cin :placeholder="locale(langKeys.PLACEHOLDER_FirstName)" :text="wallet.personal.firstname" v-on:changed="changed => bind(changed, 'wallet.personal.firstname')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_LastName)" :text="wallet.personal.lastname" v-on:changed="changed => bind(changed, 'wallet.personal.lastname')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Email)" :text="wallet.personal.email" v-on:changed="changed => bind(changed, 'wallet.personal.email')"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_BirthDate)" type="date" :text="wallet.personal.birthdate" v-on:changed="changed => bind(changed, 'wallet.personal.birthdate')"></cin>
        </section> -->

        <!-- Location Information -->
        <!-- <section class="panel">
            <figure class="header">{{locale(langKeys.WALLET_LocationHeader)}}</figure>
            <figure class="sub-header">{{locale(langKeys.WALLET_LocationDescription)}}</figure>

            <btn :text="locale(langKeys.BUTTON_AddNewLocation)" v-on:clicked="addNewLocation"></btn>
            <sel :selected="selectedLocation" :options="wallet.locations" :parser="(location) => location.name.length ? location.name : langKeys.PLACEHOLDER_DefaultLocationName"
                 v-on:changed="changed => bind(changed, 'selectedLocation')"></sel>
        </section> -->

        <!-- <section class="panel" v-if="selectedLocation">
            <btn v-if="!selectedLocation.isDefault" is-blue="true" :text="locale(langKeys.BUTTON_SetAsDefaultLocation)"
                 v-on:clicked="setAsDefaultLocation" :key="locationKey(1)"></btn>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_LocationName)" :text="selectedLocation.name"
                 v-on:changed="changed => bind(changed, 'selectedLocation.name')" :key="locationKey(2)"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Phone)" :text="selectedLocation.phone"
                 v-on:changed="changed => bind(changed, 'selectedLocation.phone')" :key="locationKey(3)"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Address)" :text="selectedLocation.address"
                 v-on:changed="changed => bind(changed, 'selectedLocation.address')" :key="locationKey(4)"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_City)" half="true" :text="selectedLocation.city"
                 v-on:changed="changed => bind(changed, 'selectedLocation.city')" :key="locationKey(5)"></cin>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Postal)" second-half="true" :text="selectedLocation.zipcode"
                 v-on:changed="changed => bind(changed, 'selectedLocation.zipcode')" :key="locationKey(6)"></cin>
            <sel :placeholder="locale(langKeys.PLACEHOLDER_Country)" :seventy="selectedLocation.country.code === 'US'" :options="countries"
                 :selected="selectedLocation.country" :parser="(obj) => obj.name"
                 v-on:changed="changed => bind(changed, 'selectedLocation.country')" :key="locationKey(7)"></sel>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_State)" v-if="selectedLocation.country.code === 'US'"
                 thirty="true" :text="selectedLocation.state" v-on:changed="changed => bind(changed, 'selectedLocation.state')"
                 :key="locationKey(8)"></cin>

            <btn v-if="wallet.locations.length > 1" margined="true" is-red="true"
                 :text="locale(langKeys.BUTTON_RemoveLocation)" v-on:clicked="removeSelectedLocation"></btn>
        </section> -->

    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import Wallet from '../models/Wallet'
    import Gold from '../models/Gold'
    import Account from '../models/Account'
    import KeyPair from '../models/KeyPair'
    import {LocationInformation} from '../models/Wallet'
    import AlertMsg from '../models/alerts/AlertMsg'
    import WalletService from '../services/WalletService'
    import AccountService from '../services/AccountService'
    import EOSKeygen from '../util/EOSKeygen'
    import {Countries} from '../data/Countries'
    import PluginRepository from '../plugins/PluginRepository'
    import {Blockchains} from '../models/Blockchains'
    import RIDLService from '../services/RIDLService'

    export default {
        data(){ return {
            wallet:null,
            accountNameOrPrivateKey:'',
            isNew:false,
            countries: Countries,
            selectedLocation:null,
            selectedNetwork:null,
            selectedKeypair:null,

            importing:false,
            noKeypair:KeyPair.fromJson({name:'None'}),
            registeringWallet:false,
            newName:'',
            saving:false,
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([
                'networks',
                'keypairs'
            ])
        },
        mounted(){
            this.selectNetwork(this.networks[0]);
            const existing = this.gold.keychain.wallets.find(x => x.publicKey === this.$route.query.publicKey);
            if(existing) this.wallet = existing.clone();
            else {
                this.wallet = Wallet.placeholder();
                this.wallet.initialize(this.gold.hash).then(() => {
                    this.wallet.name = `${this.locale(this.langKeys.GENERIC_New)} ${this.locale(this.langKeys.GENERIC_Wallet)}`;
                })
            }

            this.selectedLocation = this.wallet.defaultLocation();

            this.isNew = !existing;
        },
        methods: {
            registerWallet(){
                if(!this.registeringWallet) return this.registeringWallet = true;
            },
            async claimWallet(){
                const updatedWallet = await RIDLService.claimWallet(this.newName, this.wallet.clone(), this).catch(() => null);
                if(updatedWallet) {
                    const gold = this.gold.clone();
                    this.wallet.name = updatedWallet.name;
                    gold.keychain.updateOrPushWallet(updatedWallet);
                    await this[Actions.UPDATE_STORED_GOLD](gold);
                    this.$router.back();
                }
            },
            filteredKeypairs(){
                return [this.noKeypair].concat(this.keypairs.filter(keypair => keypair.blockchain === this.selectedNetwork.blockchain));
            },
            // This is just a fix for vuejs reusing components and losing uniqueness
            locationKey(index){ return this.wallet.locations.indexOf(this.selectedLocation)+index; },
            bind(changed, dotNotation) {
                let props = dotNotation.split(".");
                const lastKey = props.pop();
                props.reduce((obj,key)=> obj[key], this)[lastKey] = changed;
            },
            selectNetwork(network){
                this.selectedNetwork = network;
                this.selectedKeypair = null;
            },
            selectKeypair(keypair){
                this.selectedKeypair = !keypair.publicKey.length ? null : keypair;
            },
            removeAccount(){
                const account = this.wallet.accounts[this.selectedNetwork.unique()];
                const formattedAccount = PluginRepository.plugin(this.selectedNetwork.blockchain).accountFormatter(account);

                this[Actions.PUSH_ALERT](AlertMsg.RemovingAccount(formattedAccount)).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    this.wallet.removeAccount(this.selectedNetwork);
                    const refreshHelper = this.selectedNetwork;
                    this.selectedNetwork = null;
                    this.selectedNetwork = refreshHelper;
                })
            },
            importAccount(){
                if(!this.selectedKeypair || !this.selectedKeypair.publicKey.length) return false;
                this.importing = true;
                AccountService.importFromKey(this.selectedKeypair, this.selectedNetwork, this).then(imported => {
                    if(!imported.account){
                        this.importing = false;
                        return false;
                    }
                    this.wallet.setAccount(this.selectedNetwork, imported.account);
                    this.importing = false;
                }).catch(() => this.importing = false);
            },
            setAsDefaultLocation(){
                this.wallet.defaultLocation().isDefault = false;
                this.selectedLocation.isDefault = true;
            },
            addNewLocation(){
                if(!this.wallet.locations.find(location => location.isDefault)){
                    this.wallet.locations[0].isDefault = true;
                }

                const newLocation = LocationInformation.placeholder();
                this.wallet.locations.push(newLocation);
                this.selectedLocation = newLocation;
            },
            removeSelectedLocation(){
                const wasDefault = this.selectedLocation.isDefault;
                const index = this.wallet.locations.indexOf(this.selectedLocation);
                this.wallet.locations.splice(index, 1);
                if(wasDefault) this.wallet.locations[0].isDefault = true;
                this.selectedLocation = this.wallet.locations[0];
            },
            async saveWallet(){
                this.saving = true;

                if(this.isNew) {
                    const identified = await RIDLService.identify(this.wallet.publicKey);
                    if(!identified) return null;
                    this.wallet.name = identified;
                }

                //TODO: More Error handling
                // -----
                // Location names must not be empty
                // * Email
                // * State ( if exists, only 2 characters )

                const gold = this.gold.clone();
                gold.keychain.updateOrPushWallet(this.wallet);
                this[Actions.UPDATE_STORED_GOLD](gold).then(() => this.$router.back());

            },
            ...mapActions([
                Actions.SIGN_RIDL,
                Actions.UPDATE_STORED_GOLD,
                Actions.PUSH_ALERT
            ])
        }
    }
</script>

<style lang="scss">
    .wallet {
        font-family:'Ubuntu', sans-serif;



        .panel {
            padding:20px;

            &:not(:last-child){
                border-bottom:1px solid #eaeaea;
            }

            .header {
                // color:#cecece;
                // font-size:11px;
                color: #505050;
                color:#e0a839;
                font-size: 15px;
                text-transform: uppercase;
                padding-bottom:5px;
                margin-top:-5px;
                margin-bottom:10px;
                border-bottom:1px solid #eaeaea;
            }

            .sub-header {
                // color: #505050;
                // font-size:11px;
                color:#757575;
                color: #dcdcdc;
                font-size:13px;
                margin-bottom:20px;
            }
        }
    }
</style>