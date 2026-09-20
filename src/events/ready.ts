import { Client } from 'discord.js';
import { deploy } from '../services/registry';
import { initLavalink } from '../services/lavalink';

export default {
  name: 'clientReady',
  once: true,
  async run(client: Client): Promise<void> {
    if (!client.user) return;
    console.log(`online as ${client.user.tag}`);
    
    const lavalinkManager = initLavalink(client);
    client.on('raw', (d) => lavalinkManager.updateVoiceState(d));
    
    await deploy(client.user.id);
    console.log('slash commands registered');
  },
};
