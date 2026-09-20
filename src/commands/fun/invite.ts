import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  OAuth2Scopes,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  TextChannel,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS, BRAND } from '../../config';
import { getBrand } from '../../data/brand';

const PERMS = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageNicknames,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ChangeNickname,
];

function botInvite(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: PERMS.reduce((a, p) => a | p, 0n).toString(),
    scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

async function getOrCreateServerInvite(guild: Guild): Promise<string | null> {
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
      return null;
    }

    const invite = await channel.createInvite({
      maxAge: 0,
      maxUses: 0,
      reason: 'Invite command - permanent server invite',
    });

    return invite.url;
  } catch {
    return null;
  }
}

function embed(guildId: string, botUrl: string, serverUrl: string | null): EmbedBuilder {
  const description = serverUrl
    ? `[invite the bot](${botUrl})\n[join the server](${serverUrl})`
    : `[invite the bot](${botUrl})\n*server invite unavailable - missing permissions*`;
    
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`invite ${BRAND.toLowerCase()}`)
    .setDescription(description)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

function row(botUrl: string, serverUrl: string | null): ActionRowBuilder<ButtonBuilder> {
  const buttons = [
    new ButtonBuilder().setLabel('invite bot').setStyle(ButtonStyle.Link).setURL(botUrl).setEmoji('🔗'),
  ];

  if (serverUrl) {
    buttons.push(
      new ButtonBuilder().setLabel('join server').setStyle(ButtonStyle.Link).setURL(serverUrl).setEmoji('🏠')
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}

const cmd: Command = {
  name: 'invite',
  aliases: ['inv'],
  description: 'get the bot invite link',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('get the bot invite link'),

  async run(i: ChatInputCommandInteraction) {
    if (!i.guild) return;
    const botUrl = botInvite(i.client.user.id);
    const serverUrl = await getOrCreateServerInvite(i.guild);
    await i.reply({ embeds: [embed(i.guildId!, botUrl, serverUrl)], components: [row(botUrl, serverUrl)] });
  },

  async prefix(msg: Message) {
    if (!msg.guild) return;
    const botUrl = botInvite(msg.client.user!.id);
    const serverUrl = await getOrCreateServerInvite(msg.guild);
    await msg.reply({ embeds: [embed(msg.guildId!, botUrl, serverUrl)], components: [row(botUrl, serverUrl)] });
  },
};

export default cmd;
