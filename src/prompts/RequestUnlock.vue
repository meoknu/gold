<template>
    <section class="prompt-body">

        <section class="nothing-here">
            <figure class="header">
                <b>{{locale(langKeys.REQUEST_GoldIsLocked)[0]}}</b>
            </figure>
            <figure class="sub-header">
                {{locale(langKeys.REQUEST_GoldIsLocked)[1]}}
                <br><br>
                <b>{{locale(langKeys.REQUEST_GoldIsLocked)[2]}}</b><br>
                {{locale(langKeys.REQUEST_GoldIsLocked)[3]}}
            </figure>
        </section>

        <section class="prompt-actions">
            <btn :text="locale(langKeys.BUTTON_Cancel)" v-on:clicked="accepted"></btn>
        </section>

    </section>
</template>

<script>
    import { mapActions, mapGetters, mapState } from 'vuex'
    import NotificationService from '../services/NotificationService'

    export default {
        data(){ return {

        }},
        computed: {
            ...mapState([
                'prompt'
            ])
        },
        methods: {
            accepted(){
                this.prompt.responder(null);
                NotificationService.close();
            }
        }
    }
</script>

<style lang="scss">


    .prompt-body {
        padding:20px;
    }

</style>