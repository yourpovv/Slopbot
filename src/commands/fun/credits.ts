import { SlashCommandBuilder, ChatInputCommandInteraction, Message, EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { Command } from '../../types';
import { COLORS, BRAND } from '../../config';
import { asset } from '../../services/embeds';
import { getBrand } from '../../data/brand';

const CREATOR_ID = '1470172610636808425';

async function getServerInvite(guild: Guild): Promise<string | null> {
  try {
    const invites = await guild.invites.fetch();
    const permanentInvite = invites.find(inv => !inv.expiresAt && inv.maxAge === 0);
    
    if (permanentInvite) return permanentInvite.url;

    const channel = guild.channels.cache.find(
      ch => ch.isTextBased() && ch.permissionsFor(guild.members.me!)?.has('CreateInstantInvite')
    ) as TextChannel | undefined;

    if (!channel) return null;

    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, reason: 'Credits command' });
    return invite.url;
  } catch {
    return null;
  }
}

function creditsEmbed(guildId: string, serverInvite: string | null): EmbedBuilder {
  const serverLine = serverInvite 
    ? `**server** - [${BRAND}](${serverInvite})`
    : `**server** - ${BRAND}`;
    
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('credits')
    .setDescription(
      `made by <@${CREATOR_ID}>\n\n` +
      '**stack** - [discord.js 14](https://discord.js.org) · [typescript](https://www.typescriptlang.org) · [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)\n' +
      serverLine
    )
    .setImage('attachment://credits.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

const cmd: Command = {
  name: 'credits',
  aliases: ['about', 'info'],
  description: 'who made this bot',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('who made this bot'),

  async run(i: ChatInputCommandInteraction) {
    const file = asset('credits.png');
    const serverInvite = await getServerInvite(i.guild!);
    await i.reply({ embeds: [creditsEmbed(i.guildId!, serverInvite)], files: [file] });
  },

  async prefix(msg: Message) {
    const file = asset('credits.png');
    const serverInvite = await getServerInvite(msg.guild!);
    await msg.reply({ embeds: [creditsEmbed(msg.guildId!, serverInvite)], files: [file] });
  },
};

export default cmd;
