import Identity from '../models/Identity'
import Prompt from '../models/prompts/Prompt';
import * as PromptTypes from '../models/prompts/PromptTypes'
import NotificationService from '../services/NotificationService'

export default class IdentityService {

    //TODO Mock
    static register(name, gold){
        return new Promise((resolve, reject) => {
            resolve(true)
        })
    }

    //TODO Mock
    static nameExists(name, gold){
        return new Promise((resolve, reject) => {
            // Check if exists within another gold
            resolve(false);
        })
    }

    static identityPermission(domain, gold){
        return gold.keychain.permissions.find(perm => perm.isIdentityFor(domain));
    }

    static identityFromPermissionsOrNull(domain, gold){
        const identityFromPermission = IdentityService.identityPermission(domain, gold);
        return identityFromPermission ? identityFromPermission.getIdentity(gold.keychain) : null;
    }

    static getOrRequestIdentity(domain, fields, gold, callback){

        // Possibly getting an Identity that has been synced with this application.
        const identityFromPermission = IdentityService.identityFromPermissionsOrNull(domain, gold);
        let identity = identityFromPermission;

        const sendBackIdentity = id => {
            if(!id || id.hasOwnProperty('isError')){
                callback(null, null);
                return false;
            }

            callback(id.asOnlyRequiredFields(fields), !!identityFromPermission);
        };

        if(identity){
            // Even though there is a previous permission,
            // the identity might have changed and no longer
            // meets the requirements.
            if(identity.hasRequiredFields(fields)){
                sendBackIdentity(identity);
                return false;
            } else {
                // TODO: Remove permission
            }
        }
        else NotificationService.open(new Prompt(PromptTypes.REQUEST_IDENTITY, domain, null, fields, sendBackIdentity));
    }
}