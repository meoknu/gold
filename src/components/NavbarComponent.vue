<template>
    <nav :class="navState()">
        <figure class="logo" v-if="showLogo()">Gold</figure>
        <section class="breadcrumb" v-else>
            <figure class="icon" v-on:click="back">
                <i class="fa fa-chevron-left"></i>
            </figure>
            <figure class="route">{{breadcrumb()}}</figure>
        </section>
        <!-- <figure class="settings-button" v-on:click="toggleSettings">
            <i class="fa fa-gear"></i>
        </figure> -->
        <figure class="settings-button" v-on:click="lockGold">
            <i class="fa fa-lock"></i>
        </figure>
    </nav>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex';
    import * as Actions from '../store/constants';
    import {RouteNames} from '../vue/Routing'

    export default {
        computed: {
            ...mapState([
                'gold'
            ])
        },
        methods: {
            back(){ this.$router.back() },
            showLogo(){
                switch(this.$route.name){
                    case RouteNames.ENTRY:
                    case RouteNames.MAIN_MENU:
                    case RouteNames.FIRST_TIME:
                    case RouteNames.ONBOARDING:
                    case RouteNames.SHOW_MNEMONIC: return true;
                    default: return false;
                }
            },
            lockGold(){
                this[Actions.LOCK]().then(() => {
                    this.$router.push({name:RouteNames.ENTRY});
                })
            },
            navState(){
                switch(this.$route.name){
                    case RouteNames.ENTRY: if(this.gold.settings.hasEncryptionKey) return 'locked';
                                           else return 'no-chain';
                    case RouteNames.MAIN_MENU: return 'main-menu-nav';
                    default: return 'main-menu-nav';
                }
            },
            breadcrumb(){
                // TODO: Localize
                switch(this.$route.name){
                    case RouteNames.LOAD_FROM_BACKUP: return 'Import Keychain';
                    case RouteNames.SETTINGS: return 'Settings';
                    case RouteNames.TRANSFER: return 'Transfer';
                    case RouteNames.WALLETS: return 'Wallets';
                    case RouteNames.WALLET: return 'Wallet';
                    case RouteNames.PERMISSIONS:
                    case RouteNames.DOMAIN_PERMISSIONS: return 'Permissions';
                    case RouteNames.HISTORY: return 'History';
                    case RouteNames.NETWORKS: return 'Networks';
                    case RouteNames.NETWORK: return 'Network';
                    case RouteNames.CHANGE_PASSWORD: return 'Password';
                    case RouteNames.BACKUP:
                    case RouteNames.EXPORT_JSON: return 'Backup';
                    case RouteNames.DESTROY: return 'Destroy';
                    case RouteNames.AUTO_LOCK: return 'Auto Lock';
                    case RouteNames.LANGUAGE: return 'Language';
                    case RouteNames.KEYPAIRS: return 'Key Pair';
                    case RouteNames.KEYS: return 'Key Pairs';
                }
                return 'Undefined'
            },
            toggleSettings(){
                if(this.$route.name === RouteNames.SETTINGS) this.back();
                else this.$router.push({name:RouteNames.SETTINGS})
            },
            ...mapActions([
                Actions.LOCK,
                Actions.UPDATE_STORED_GOLD
            ])
        },
    }
</script>

<style lang="scss">
    nav {
        height:600px;
        max-height:60px;
        line-height:60px;
        // background:#fff;
        background: #545454;
        transition:all 0.2s ease;
        transition-property: max-height, line-height, background;
        padding:0 20px;
        overflow:hidden;
        /*border-bottom:1px solid #f9f9f9;*/
        position: relative;
        z-index:2;

        .logo {
            font-family: 'Ubuntu', sans-serif;
            font-size:22px;
            // color:#888888;
            color:#e0a839;
            width:calc(100% - 60px);
            float:left;
            font-weight: 900;
        }

        .settings-button {
            cursor: pointer;
            float: right;
            height: 60px;
            margin-left:10px;
            line-height: 59px;
            font-size: 24px;
            text-align:right;
            color: #d6d6d6;
        }

        .breadcrumb {
            width:calc(100% - 60px);
            float:left;

            .icon {
                cursor: pointer;
                display:inline-block;
                font-size:18px;
                color:#dbdbdb;
                padding-right:15px;
                transition: color 0.2s ease;

                &:hover {
                    color:rgba(0,0,0,0.3);
                }
            }

            .route {
                display:inline-block;
                font-family:'Ubuntu', sans-serif;
                font-size:18px;
                color:#a5a5a5;
                vertical-align: top;
            }
        }

        &.no-chain {
            max-height:299px;
            line-height:299px;

            .logo {
                font-size:64px;
                color: #e0a839;
                width: 100%;
                background-color: #545454;
                // color:#656565;
                // width:100%;
                text-align:center;
            }
        }

        &.locked {
            max-height:450px;
            line-height:450px;

            .logo {
                font-size:64px;
                // color:#656565;
                color: #e0a839;
                width:100%;
                text-align:center;
            }
        }

        &.main-menu-nav {
            background:#f9f9f9;
        }
    }
</style>