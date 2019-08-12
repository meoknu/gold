import PluginRepository from '../../plugins/PluginRepository';
import {Blockchains} from '../../models/Blockchains'

export const m6_0_4 = async gold => {
    const endorsedNetworks = [
        await PluginRepository.plugin(Blockchains.EOS).getEndorsedNetwork(),
        await PluginRepository.plugin(Blockchains.ETH).getEndorsedNetwork()
    ];

    gold.settings.networks.map(network => {
        const endorsedNetwork = endorsedNetworks.find(endorsed => endorsed.host === network.host);
        if(endorsedNetwork) {
            const endorsedNetwork = endorsedNetworks.find(endorsed => endorsed.host === network.host);
            network.port = endorsedNetwork.port;
        }
    });

    gold.keychain.wallets.map(id => {
        const filtered = {};
        Object.keys(id.accounts).map(key => {
            if(gold.settings.networks.find(net => net.unique() === key))
                filtered[key] = id.accounts[key];
        })

        id.accounts = filtered;
    });

    return true;
};