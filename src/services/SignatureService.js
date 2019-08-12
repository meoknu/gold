import Prompt from '../models/prompts/Prompt';
import * as PromptTypes from '../models/prompts/PromptTypes'
import Wallet from '../models/Wallet';
import KeyPair from '../models/KeyPair';
import Network from '../models/Network';
import Error from '../models/errors/Error';
import {LocationFields} from '../models/Wallet';
import * as HistoricEventTypes from '../models/histories/HistoricEventTypes'
import ObjectHelpers from '../util/ObjectHelpers'
import ContractHelpers from '../util/ContractHelpers'
import NotificationService from './NotificationService'
import Permission from '../models/Permission'
import {Blockchains} from '../models/Blockchains';
import PluginRepository from '../plugins/PluginRepository'

export default class SignatureService {

    static requestArbitrarySignature(payload, gold, context, sendResponse){
        const {publicKey, domain, data} = payload;

        const walletSigner = gold.keychain.wallets.find(id => id.publicKey === publicKey);
        const accountSigners = gold.keychain.findAccountsWithPublicKey(publicKey);
        if(!walletSigner && !accountSigners.length) {
            sendResponse(Error.signatureError("signature_rejected", "User rejected the signature request"));
            return false;
        }

        NotificationService.open(new Prompt(PromptTypes.REQUEST_ARBITRARY_SIGNATURE, domain, null, Object.assign(payload, {walletSigner, accountSigners}), approval => {
            if(!approval || !approval.hasOwnProperty('accepted')){
                sendResponse(Error.signatureError("signature_rejected", "User rejected the signature request"));
                return false;
            }

            PluginRepository.plugin(KeyPair.blockchain(publicKey)).signer(context, payload, publicKey, signature => {
                if(!signature){
                    sendResponse(Error.maliciousEvent());
                    return false;
                }

                sendResponse(signature);
            }, true, payload.isHash)


        }));


    }

    static requestSignature(payload, gold, context, sendResponse){
        const {domain, network, requiredFields} = payload;

        // Checking if wallet still exists
        const wallet = gold.keychain.findWalletFromDomain(payload.domain);
        if(!wallet || wallet.isDisabled){
            sendResponse(Error.walletMissing());
            return false;
        }

        // Getting the account from the wallet based on the network
        const account = wallet.networkedAccount(Network.fromJson(network));
        if(!account) {
            sendResponse(Error.signatureAccountMissing());
            return false;
        }

        const blockchain = account.blockchain();

        // Checking if Wallet still has all the necessary accounts
        const requiredAccounts = PluginRepository.plugin(blockchain).actionParticipants(payload);
        const formattedName = PluginRepository.plugin(blockchain).accountFormatter(account);
        if(!requiredAccounts.includes(formattedName) && !requiredAccounts.includes(account.publicKey)){
            sendResponse(Error.signatureAccountMissing());
            return false;
        }

        const sign = (returnedFields) => {
            PluginRepository.plugin(blockchain).signer(context, payload, account.publicKey, signature => {
                if(!signature){
                    sendResponse(Error.maliciousEvent());
                    return false;
                }

                // Adding historic event
                context.addHistory(HistoricEventTypes.SIGNED_TRANSACTION, {
                    domain,
                    network,
                    walletName:wallet.name,
                    publicKey:wallet.publicKey,
                    account:account,
                    transaction:payload.transaction,
                    hash:'' // <-- hmmm, what to do with this? There is no hash here to track yet. :(
                });

                sendResponse({
                    signatures:[signature],
                    returnedFields:returnedFields
                });
            })
        };



        const hasTransactionPermissions = payload.messages.every(message => {
            const {contract, action} = ContractHelpers.getContractAndActionNames(message);
            const checksum = ContractHelpers.contractActionChecksum(contract, action, domain, network);
            const fields = message.data;
            return gold.keychain.hasPermission(checksum, fields);
        });

        const needsLocationAndWalletHasMultiple = (wallet.locations.length > 1 && requiredFields.location.length);

        if(!needsLocationAndWalletHasMultiple && hasTransactionPermissions) {
            const walletClone = wallet.clone();
            const returnedFields = Wallet.asReturnedFields(requiredFields, walletClone, walletClone.locations[0]);
            sign(returnedFields);
        }

        else NotificationService.open(new Prompt(PromptTypes.REQUEST_SIGNATURE, domain, network, payload, approval => {
            if(!approval || !approval.hasOwnProperty('accepted')){
                sendResponse(Error.signatureError("signature_rejected", "User rejected the signature request"));
                return false;
            }

            if(approval.whitelisted){
                context.addPermissions(payload.messages.map(message => {
                    const fields = message.data;
                    const {contract, action} = ContractHelpers.getContractAndActionNames(message);
                    const checksum = ContractHelpers.contractActionChecksum(contract, action, domain, network);
                    return Permission.fromJson({
                        domain,
                        network,
                        contract,
                        action,
                        wallet:wallet.publicKey,
                        keypair:account.keypairUnique,
                        checksum,
                        timestamp:+ new Date(),
                        mutableFields:approval.mutableFields,
                        fields
                    });
                }));
            }

            sign(approval.returnedFields);
        }));
    }

}