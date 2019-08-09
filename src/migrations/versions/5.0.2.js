import PluginRepository from '../../plugins/PluginRepository';
import {Blockchains} from '../../models/Blockchains'

export const m5_0_2 = async gold => {
    const eos = PluginRepository.plugin(Blockchains.EOS);
    const endorsedNetwork = await eos.getEndorsedNetwork();
    if(!gold.settings.networks.find(network => network.host === endorsedNetwork.host))
        gold.settings.networks.push(endorsedNetwork);
};