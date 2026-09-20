import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { TOKEN } from './config';
import { load } from './services/registry';
import { join } from 'path';
import { readdirSync } from 'fs';
import { mkdirSync, existsSync } from 'fs';

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Reaction],
});

load(join(__dirname, 'commands'));

const eventsDir = join(__dirname, 'events');
const eventFiles = readdirSync(eventsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(join(eventsDir, file)).default;
  if (event.once) {
    client.once(event.name, (...args: unknown[]) => event.run(...args));
  } else {
    client.on(event.name, (...args: unknown[]) => event.run(...args));
  }
}

client.on('error', (err) => console.error('client error:', err.message));
process.on('unhandledRejection', (err: Error) => console.error('unhandled:', err.message));

(global as any).client = client;

client.login(TOKEN);
