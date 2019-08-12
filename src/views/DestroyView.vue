<template>
    <section class="backup scroller">

        <!-- Unverified -->
        <section class="panel" v-if="!verified">
            <figure class="header">{{locale(langKeys.GENERIC_VerifyPassword_Header)}}</figure>
            <figure class="sub-header">{{locale(langKeys.GENERIC_VerifyPassword_Description)}}</figure>
            <cin :placeholder="locale(langKeys.PLACEHOLDER_Password)" type="password" v-on:changed="changed => bind(changed, 'currentPassword')" :key="1"></cin>
            <btn v-on:clicked="verifyCurrentPassword" :text="locale(langKeys.PLACEHOLDER_ConfirmPassword)" :margined="true"></btn>
        </section>

        <!-- Verified -->
        <section class="panel" v-else>
            <figure class="header">{{locale(langKeys.DESTROY_Header)}}</figure>
            <figure class="sub-header">{{locale(langKeys.DESTROY_Description)}}</figure>
            <btn v-on:clicked="_destroy" :text="locale(langKeys.BUTTON_DestroyGold)" is-red="true" :margined="true"></btn>
        </section>

    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import AlertMsg from '../models/alerts/AlertMsg'
    import WalletService from '../services/WalletService';
    import Mnemonic from '../util/Mnemonic'
    import EOSKeygen from '../util/EOSKeygen'
    import StorageService from '../services/StorageService'
    import AuthenticationService from '../services/AuthenticationService'

    export default {
        data(){ return {
            currentPassword:'',
            newPassword:'',
            newPasswordConfirmation:'',
            verified:false,
        }},
        computed: {
            ...mapState([
                'gold'
            ]),
            ...mapGetters([

            ])
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            verifyCurrentPassword(){
                AuthenticationService.verifyPassword(this.currentPassword, this).then(() => {
                    this.verified = true;
                });
            },
            _destroy(){
                this[Actions.PUSH_ALERT](AlertMsg.DestroyingGold()).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
                    this[Actions.DESTROY]().then(() => this.$router.push({name:RouteNames.ENTRY}));
                    // this[Actions.DESTROY]().then(() => window.close());
                });
            },
            destroy(){
                this[Actions.PUSH_ALERT](AlertMsg.DestroyingGold()).then(res => {
                    if(!res || !res.hasOwnProperty('accepted')) return false;
//                    this[Actions.DESTROY]().then(() => this.$router.push({name:RouteNames.ENTRY}));
                    this[Actions.DESTROY]().then(() => window.close());
                });
            },
            ...mapActions([
                Actions.PUSH_ALERT,
                Actions.SET_SEED,
                Actions.IS_UNLOCKED,
                Actions.DESTROY
            ])
        }
    }
</script>

<style lang="scss">
    .checkbox {
        width:56px;
        float:left;
        margin-right:15px;
    }
    .backup {
        font-family:'Ubuntu', sans-serif;

        .panel {
            padding:20px;

            &:not(:last-child){
                border-bottom:1px solid #eaeaea;
            }

            .header {
                color: #505050;
                font-size: 15px;
                text-transform: uppercase;
                padding-bottom:5px;
                margin-top:-5px;
                margin-bottom:10px;
                border-bottom:1px solid #eaeaea;
            }

            .sub-header {
                color:#757575;
                font-size:13px;
                margin-bottom:20px;
            }
        }
    }
</style>