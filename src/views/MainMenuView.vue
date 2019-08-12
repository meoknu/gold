<template>
    <section class="main-menu">
        <section class="item" v-for="link in links">
            <router-link :to="{name:link.route}" v-if="link.name != locale(langKeys.MAINMENU_Lock)">
                <figure class="icon"><i class="fa" :class="'fa-'+link.icon"></i></figure>
                <figure class="text">{{link.name}}</figure>
                <figure class="icon right"><i class="fa" :class="'fa-arrow-right'"></i></figure>
            </router-link>

            <section v-else v-on:click="lockGold">
                <figure class="icon last"><i class="fa" :class="'fa-'+link.icon"></i></figure>
                <figure class="text">{{link.name}}</figure>
            </section>
        </section>
    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex';
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'
    import * as LANG_KEYS from '../localization/keys';


    import Network from '../models/Network'
    import Wallet from '../models/Wallet'
    import Permission from '../models/Permission'

    export default {
        data(){ return {
            links:[
                {route:RouteNames.WALLETS, name:this.locale(LANG_KEYS.MAINMENU_Wallets), icon:'address-book'},
                {route:RouteNames.KEYS, name:this.locale(LANG_KEYS.MAINMENU_Keys), icon:'key'},
                // {route:RouteNames.PERMISSIONS, name:this.locale(LANG_KEYS.MAINMENU_Permissions), icon:'shield'},
                // {route:RouteNames.HISTORY, name:this.locale(LANG_KEYS.MAINMENU_History), icon:'history'},
                {route:RouteNames.CHANGE_PASSWORD, name:this.locale(LANG_KEYS.SETTINGSMENU_Password), icon:'asterisk'},
                {route:RouteNames.BACKUP, name:this.locale(LANG_KEYS.SETTINGSMENU_Backup), icon:'save'},
                {route:RouteNames.DESTROY, name:this.locale(LANG_KEYS.SETTINGSMENU_Destroy), icon:'trash-o'},
                // {name:this.locale(LANG_KEYS.MAINMENU_Lock), icon:'lock'},
            ]
        }},
        computed: {
            ...mapState([
                'gold'
            ])
        },
        mounted(){
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            lockGold(){
                this[Actions.LOCK]().then(() => {
                    this.$router.push({name:RouteNames.ENTRY});
                })
            },
            ...mapActions([
                Actions.LOCK,
                Actions.UPDATE_STORED_GOLD
            ])
        }
    }
</script>

<style lang="scss">

    .main-menu {
        // padding:40px 0;
        padding:0px 0;

        .item {
            cursor: pointer;
            // padding:0 40px;
            padding:0 15px;
            transition:background 0.2s ease;
            border-bottom: 1px solid #e8e8e8;

            &:hover {
                background:#f8f8f8;
            }

            .icon {
                padding:16px 0;
                display:inline-block;
                font-size:18px;
                color:#656565;
                width:30px;
                text-align:center;
                margin-right:10px;

                &:not(.last){
                    // border-bottom:1px solid #e3e3e3;
                    border-bottom:none;
                }

                &.right {
                    float: right;
                }
            }

            .text {
                padding:16px 0;
                display:inline-block;
                // font-size:24px;
                font-size:18px;
                color:#656565;
                font-family:'Ubuntu',sans-serif;
                font-weight:300;
            }
        }
    }

</style>