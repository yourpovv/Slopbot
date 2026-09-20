import { Manager } from 'erela.js';
import { Client } from 'discord.js';

let manager: Manager | null = null;

export function initLavalink(client: Client): Manager {
  const host = process.env.LAVALINK_HOST || 'localhost';
  const port = parseInt(process.env.LAVALINK_PORT || '80');
  const password = process.env.LAVALINK_PASSWORD || 'youshallnotpass';
  const secure = host.includes('railway.app') || port === 443;
  
  console.log(`[Lavalink] Initializing connection:`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Secure: ${secure}`);
  console.log(`  URL: ${secure ? 'wss' : 'ws'}://${host}:${port}`);
  
  const nodes = process.env.LAVALINK_NODES 
    ? JSON.parse(process.env.LAVALINK_NODES)
    : [{
        identifier: 'main',
        host,
        port,
        password,
        secure,
        retryAmount: 5,
        retryDelay: 3000,
      }];

  manager = new Manager({
    nodes,
    send: (id, payload) => {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  });

  manager.on('nodeConnect', (node) => {
    console.log(`✅ Lavalink node "${node.options.identifier}" connected successfully`);
  });

  manager.on('nodeError', (node, error) => {
    console.error(`❌ Lavalink node "${node.options.identifier}" error:`, error);
  });
  
  manager.on('nodeDisconnect', (node, reason) => {
    console.warn(`⚠️ Lavalink node "${node.options.identifier}" disconnected:`, reason);
  });

  manager.on('trackStart', (player, track) => {
    console.log(`Now playing: ${track.title} in guild ${player.guild}`);
  });

  manager.on('trackEnd', (player) => {
    if (player.queue.size > 0 || player.get('loop')) {
      return;
    }
  });

  manager.on('queueEnd', (player) => {
    const channel = client.channels.cache.get(player.textChannel!);
    if (channel && 'send' in channel && typeof channel.send === 'function') {
      channel.send('Queue ended. Use `/music play` to add more songs!');
    }
    player.destroy();
  });

  manager.init(client.user?.id);
  
  return manager;
}

export function getLavalink(): Manager {
  if (!manager) {
    throw new Error('Lavalink manager not initialized. Call initLavalink() first.');
  }
  return manager;
}
