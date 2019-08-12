import * as AlertTypes from './AlertTypes'
import {localized} from '../../localization/locales'
import * as LANG_KEYS from '../../localization/keys'
import {store} from '../../store/store';

const locale = key => localized(key, store.getters.language);

export default class AlertMsg {

    constructor(_type, _header, _description, _list = []){
        this.type = _type;
        this.header = _header;
        this.description = _description;
        this.list = _list;
    }


    /***************************************/
    /*            Error Messages           */
    /***************************************/

    static BadWalletName(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_BadWalletName)
        );
    }

    static NoSuchWalletName(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_NoSuchWalletName)
        );
    }

    static WalletNameExists(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_WalletNameExists)
        );
    }

    static BadKeyPairName(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_BadKeyPairName)
        );
    }

    static KeyPairExists(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_KeyPairExists)
        );
    }

    static InvalidPrivateKey(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_InvalidPrivateKey)
        );
    }

    static NoAccountsFound(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_NoAccountsFound)
        );
    }

    static PasswordsDoNotMatch(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_PasswordsDoNotMatch)
        );
    }

    static BadPassword(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_BadPassword)
        );
    }

    static WrongPassword(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_WrongPassword)
        );
    }

    static NetworkHostInvalid(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_NetworkHostInvalid)
        );
    }

    static NetworkExists(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_NetworkExists)
        );
    }

    static RemovingEndorsedNetwork(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_RemovingEndorsedNetwork)
        );
    }

    static NoWalletWithProperties(fields){


        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_NoWalletWithProperties)(fields.toFieldsArray())
        );
    }

    static YouMustSelectAnWallet(){
        return new AlertMsg(
            AlertTypes.Error,
            ...locale(LANG_KEYS.ALERT_YouMustSelectAnWallet)
        );
    }





    /***************************************/
    /*               Prompts               */
    /***************************************/

    static DestroyingGold(){
        return new AlertMsg(AlertTypes.Prompt,
            'Destroying Gold',
            'This is your last chance to double check your backups.'
        );
    }

    static RevokingWallet(domain){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RevokingWallet)(domain)
        );
    }

    static RevokingContract(domain){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RevokingContract)(domain)
        );
    }

    static RevokingContractAction(domain){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RevokingContractAction)(domain)
        );
    }

    static RemovingWallet(name){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RevokingWallet)(name)
        );
    }

    static RemovingAccount(formattedWallet){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RemovingAccount)(formattedWallet)
        );
    }

    static DeletingKeyPair(wallets){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_DeletingKeyPair)(wallets)
        );
    }

    static RemovingNetwork(){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_RemovingNetwork)
        );
    }

    static WhitelistingContractAction(){
        return new AlertMsg(AlertTypes.Prompt,
            ...locale(LANG_KEYS.PROMPT_WhitelistingContractAction)
        );
    }

    static SelectAccount(accounts){
        return new AlertMsg(
            AlertTypes.SelectAccount,
            ...locale(LANG_KEYS.PROMPT_SelectAccount),
            accounts
        );
    }

    static NamedAccount(){
        return new AlertMsg(
            AlertTypes.NamedAccount,
            ...locale(LANG_KEYS.PROMPT_SelectAccount)
        );
    }

    static ClaimWallet(name){
        return new AlertMsg(
            AlertTypes.ClaimWallet,
            ...locale(LANG_KEYS.PROMPT_ClaimWallet),

        );
    }

}