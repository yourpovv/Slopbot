import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  Guild,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS } from '../../config';

async function getOrCreateInvite(guild: Guild): Promise<string> {
  try {
    const invites = await guild.invites.fetch();
    const permanentInvite = invites.find(inv => !inv.expiresAt && inv.maxAge === 0);
    
    if (permanentInvite) {
      return permanentInvite.url;
    }

    const channel = guild.channels.cache.find(
      ch => ch.isTextBased() && ch.permissionsFor(guild.members.me!)?.has('CreateInstantInvite')
    ) as TextChannel | undefined;

    if (!channel) {
      throw new Error('no suitable channel for invite');
    }

    const invite = await channel.createInvite({
      maxAge: 0, // perm
      maxUses: 0, // unlimited uses
      reason: 'Promo command - permanent server invite',
    });

    return invite.url;
  } catch (err) {
    console.error('[getOrCreateInvite]', err);
    throw err;
  }
}

function embed(guildName: string, inviteUrl: string): EmbedBuilder {

  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setDescription(
      `_ _\n` +
      `_ _         .              **[${guildName}](${inviteUrl})**              \` 🍃 \`\n` +
      `_ _         stox  ﹒   __social__  ﹒   gws     𓂃\n` +
      `_ _         ꒰꒰      *join   for   active   **chats & vcs** * [⠀](${inviteUrl})\n` +
      `_ _`
    );
}

function row(inviteUrl: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('join server')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl)
      .setEmoji('🍃'),
  );
}

const cmd: Command = {
  name: 'promo',
  aliases: ['ad', 'promote'],
  description: 'promote the server',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('promo')
    .setDescription('promote the server'),

  async run(i: ChatInputCommandInteraction) {
    if (!i.guild) return;
    
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      const inviteUrl = await getOrCreateInvite(i.guild);
      const ch = i.channel as TextChannel;
      
      await ch.send({ embeds: [embed(i.guild.name, inviteUrl)], components: [row(inviteUrl)] });
      await i.editReply({ embeds: [{ description: '✅ promo sent', color: COLORS.success }] });
    } catch (err) {
      console.error('[promo run]', err);
      await i.editReply({ embeds: [{ description: '❌ failed to create invite', color: COLORS.error }] });
    }
  },

  async prefix(msg: Message) {
    if (!msg.guild) return;
    
    try {
      const inviteUrl = await getOrCreateInvite(msg.guild);
      const ch = msg.channel as TextChannel;
      
      await msg.delete().catch(() => {});
      await ch.send({ embeds: [embed(msg.guild.name, inviteUrl)], components: [row(inviteUrl)] });
    } catch (err) {
      console.error('[promo prefix]', err);
      await msg.reply('❌ failed to create invite').catch(() => {});
    }
  },
};

export default cmd;
