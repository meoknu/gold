<template>
    <section class="prompt-body">

        <section class="partitioned">

            <section class="partition scroller" style="padding:40px 20px;">

                <section class="cleartext">
                    <section class="description">
                        <b>{{prompt.data.whatfor}}</b>
                        <br>
                        <b style="font-size:14px;">{{prompt.data.data}}</b>
                    </section>
                </section>

            </section>

            <section class="partition scroller">
                <section class="panel-box">
                    <section class="panel">
                        <figure class="header public-key">{{keyToName(prompt.data.publicKey)}}</figure>
                    </section>
                </section>
                <br>
                <section v-for="signer in signers()" class="panel-box">
                    <section class="panel">
                        <figure class="header big wallet-header">{{signer.name}}</figure>
                    </section>
                </section>
            </section>

        </section>

        <section class="prompt-actions">
            <btn :text="locale(langKeys.BUTTON_Deny)" half="true" v-on:clicked="denied"></btn>
            <btn :text="locale(langKeys.BUTTON_Accept)" half="true" is-blue="true" v-on:clicked="accepted"></btn>
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

    export default {
        data(){ return {

        }},
        computed: {
            ...mapState([
                'prompt',
                'gold'
            ]),
            ...mapGetters([

            ])
        },
        methods: {
            bind(changed, original) { this[original] = changed },
            keyToName(publicKey){
                const keypair = this.gold.keychain.getKeyPairByPublicKey(publicKey);
                return keypair ? keypair.name : publicKey;
            },
            signers(){
                if(this.prompt.data.walletSigner) return [this.prompt.data.walletSigner];
                else return this.prompt.data.accountSigners;
            },
            accepted(){
                this.prompt.responder({accepted:true});
                NotificationService.close();
            },
            denied(){
                this.prompt.responder(null);
                NotificationService.close();
            },
            ...mapActions([
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
        font-family: 'Open Sans', sans-serif;

        .wallet-header {
            width:calc(100% - 98px);
            display:inline-block;
        }

        .description {
            margin-top:5px;
            font-size:9px;
            color:#b8b8b8;

            b { color:#707070; }
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

                .cleartext {
                    padding:20px;
                    border:2px dashed rgba(0,0,0,0.05);
                    border-radius: 4px;
                }

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