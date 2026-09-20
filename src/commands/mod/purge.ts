import { SlashCommandBuilder, ChatInputCommandInteraction, Message as DiscordMessage, PermissionFlagsBits, TextChannel, MessageFlags, Collection, User } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';

const MAX_PURGE = 100;
const CONFIRM_DELAY = 3_000;

type FilterType = 'embeds' | 'files' | 'images' | 'links' | 'mentions' | 'invites' | 'bots' | 'reactions';

function hasEmbeds(msg: DiscordMessage): boolean {
  return msg.embeds.length > 0;
}

function hasFiles(msg: DiscordMessage): boolean {
  return msg.attachments.size > 0;
}

function hasImages(msg: DiscordMessage): boolean {
  return msg.attachments.some(a => a.contentType?.startsWith('image/') || a.contentType?.startsWith('video/'));
}

function hasLinks(msg: DiscordMessage): boolean {
  return /https?:\/\//.test(msg.content);
}

function hasMentions(msg: DiscordMessage): boolean {
  return msg.mentions.users.size > 0 || msg.mentions.roles.size > 0 || msg.mentions.channels.size > 0;
}

function hasInvites(msg: DiscordMessage): boolean {
  return /discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\//.test(msg.content);
}

function isBot(msg: DiscordMessage): boolean {
  return msg.author.bot;
}

function hasReactions(msg: DiscordMessage): boolean {
  return msg.reactions.cache.size > 0;
}

function matchesText(msg: DiscordMessage, text: string): boolean {
  return msg.content.toLowerCase().includes(text.toLowerCase());
}

function applyFilters(messages: Collection<string, DiscordMessage>, user?: User, type?: FilterType, containing?: string): Collection<string, DiscordMessage> {
  let filtered = messages;
  
  if (user) {
    filtered = filtered.filter(msg => msg.author.id === user.id);
  }
  
  if (type) {
    switch (type) {
      case 'embeds':
        filtered = filtered.filter(hasEmbeds);
        break;
      case 'files':
        filtered = filtered.filter(hasFiles);
        break;
      case 'images':
        filtered = filtered.filter(hasImages);
        break;
      case 'links':
        filtered = filtered.filter(hasLinks);
        break;
      case 'mentions':
        filtered = filtered.filter(hasMentions);
        break;
      case 'invites':
        filtered = filtered.filter(hasInvites);
        break;
      case 'bots':
        filtered = filtered.filter(isBot);
        break;
      case 'reactions':
        filtered = filtered.filter(hasReactions);
        break;
    }
  }
  
  if (containing) {
    filtered = filtered.filter(msg => matchesText(msg, containing));
  }
  
  return filtered;
}

const cmd: Command = {
  name: 'purge',
  aliases: ['clear', 'prune'],
  description: 'bulk delete messages',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageMessages],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('bulk delete messages')
    .addIntegerOption(o =>
      o.setName('amount').setDescription('how many to check (1-100)').setRequired(true).setMinValue(1).setMaxValue(MAX_PURGE)
    )
    .addUserOption(o =>
      o.setName('user').setDescription('only delete messages from this user')
    )
    .addStringOption(o =>
      o.setName('type').setDescription('only delete specific type of message')
        .addChoices(
          { name: 'embeds', value: 'embeds' },
          { name: 'files', value: 'files' },
          { name: 'images', value: 'images' },
          { name: 'links', value: 'links' },
          { name: 'mentions', value: 'mentions' },
          { name: 'invites', value: 'invites' },
          { name: 'bots', value: 'bots' },
          { name: 'reactions', value: 'reactions' }
        )
    )
    .addStringOption(o =>
      o.setName('containing').setDescription('only delete messages with this text')
    ),

  async run(i: ChatInputCommandInteraction) {
    const amount = i.options.getInteger('amount', true);
    const user = i.options.getUser('user') ?? undefined;
    const type = i.options.getString('type') as FilterType | null;
    const containing = i.options.getString('containing') ?? undefined;
    
    const channel = i.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: amount });
    const filtered = applyFilters(messages, user, type ?? undefined, containing);
    
    if (filtered.size === 0) {
      return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'warn', 'no messages match the filters')], flags: MessageFlags.Ephemeral });
    }
    
    const deleted = await channel.bulkDelete(filtered, true);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `deleted **${deleted.size}** messages`)], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: DiscordMessage, args: string[]) {
    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > MAX_PURGE) {
      return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'usage: .purge <1-100> [user] [type] [text]')] });
    }
    
    const channel = msg.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: amount + 1 });
    
    const user = msg.mentions.users.first();
    const filtered = applyFilters(messages, user, undefined, args.slice(1).join(' ') || undefined);
    
    if (filtered.size === 0) {
      return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'warn', 'no messages match the filters')] });
    }
    
    const deleted = await channel.bulkDelete(filtered, true);
    const confirm = await channel.send({ embeds: [brandEmbed(msg.guildId!, 'success', `deleted **${deleted.size}** messages`)] });
    setTimeout(() => confirm.delete().catch(() => {}), CONFIRM_DELAY);
  },
};

export default cmd;
