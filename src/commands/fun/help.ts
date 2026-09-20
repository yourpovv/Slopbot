import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS } from '../../config';
import { getBrand } from '../../data/brand';

const COMMANDS = {
  admin: [
    { name: 'adscreate', desc: 'create a new ad', restricted: 'admin' as const },
    { name: 'adsedit', desc: 'edit an existing ad', restricted: 'admin' as const },
    { name: 'adsdelete', desc: 'delete an ad', restricted: 'admin' as const },
    { name: 'adslist', desc: 'list all ads', restricted: 'admin' as const },
    { name: 'adspost', desc: 'post an ad to channel', restricted: 'admin' as const },
    { name: 'brand', desc: 'set server brand name', restricted: 'owner' as const },
    { name: 'colorroles', desc: 'send color role picker', restricted: 'staff' as const },
    { name: 'setup', desc: 'configure server settings', restricted: 'owner' as const },
    { name: 'mod', desc: 'post moderation commands', restricted: 'staff' as const },
    { name: 'roles', desc: 'send role picker embed', restricted: 'staff' as const },
    { name: 'rolepanel', desc: 'manage button role panels', restricted: 'owner' as const },
    { name: 'rules', desc: 'send rules embed', restricted: 'staff' as const },
    { name: 'tickets', desc: 'post ticket panel', restricted: 'staff' as const },
    { name: 'verify', desc: 'set up verification', restricted: 'staff' as const },
    { name: 'starboard', desc: 'configure starboard', restricted: 'owner' as const },
    { name: 'autoresponder', desc: 'manage autoresponders', restricted: 'owner' as const },
    { name: 'levels', desc: 'configure leveling', restricted: 'owner' as const },
  ],
  fun: [
    { name: 'punch', desc: 'punch someone' },
    { name: 'slap', desc: 'slap someone' },
    { name: 'rpkick', desc: 'kick someone (rp)' },
    { name: 'kill', desc: 'eliminate someone' },
    { name: 'abuse', desc: 'bully someone' },
    { name: 'block', desc: 'block user messages' },
    { name: 'unblock', desc: 'unblock a user' },
    { name: 'blocklist', desc: 'view blocked users' },
    { name: 'credits', desc: 'who made this bot' },
    { name: 'crime', desc: 'commit random crime' },
    { name: '8ball', desc: 'ask magic 8ball' },
    { name: 'fakekick', desc: 'fake kick someone', restricted: 'staff' as const },
    { name: 'fakeban', desc: 'fake ban someone', restricted: 'staff' as const },
    { name: 'bick', desc: 'fake kick someone', restricted: 'staff' as const },
    { name: 'bean', desc: 'fake ban someone', restricted: 'staff' as const },
    { name: 'fakenuke', desc: 'fake nuke server', restricted: 'staff' as const },
    { name: 'giveaway', desc: 'start a giveaway', restricted: 'staff' as const },
    { name: 'impersonate', desc: 'impersonate user', restricted: 'staff' as const },
    { name: 'invite', desc: 'get bot invite link' },
    { name: 'lfg', desc: 'looking-for-group party' },
    { name: 'memberinfo', desc: 'view member info' },
    { name: 'nerdify', desc: 'react 🤓 to messages' },
    { name: 'unnerdify', desc: 'stop nerdifying' },
    { name: 'nerdifylist', desc: 'view nerdified users' },
    { name: 'poll', desc: 'create a poll' },
    { name: 'promo', desc: 'promote the server', restricted: 'staff' as const },
    { name: 'rate', desc: 'rate someone' },
    { name: 'rep', desc: 'give/check rep' },
    { name: 'reptop', desc: 'rep leaderboard' },
    { name: 'ship', desc: 'ship two users' },
    { name: 'simp', desc: 'simp meter' },
    { name: 'thisorthat', desc: 'pick between options' },
    { name: 'touchgrass', desc: 'touch some grass' },
    { name: 'uwuify', desc: 'uwuify text' },
    { name: 'voice', desc: 'manage your voice channel' },
    { name: 'rank', desc: 'view your XP rank' },
    { name: 'leaderboard', desc: 'server XP leaderboard' },
    { name: 'music', desc: 'play music in voice channels' },
  ],
  games: [{ name: 'blackjack', desc: 'play blackjack' }],
  mod: [
    { name: 'ban', desc: 'ban a member', restricted: 'staff' as const },
    { name: 'kick', desc: 'kick a member', restricted: 'staff' as const },
    { name: 'mute', desc: 'timeout a member', restricted: 'staff' as const },
    { name: 'unmute', desc: 'remove timeout', restricted: 'staff' as const },
    { name: 'purge', desc: 'bulk delete messages', restricted: 'staff' as const },
    { name: 'nuke', desc: 'delete and recreate channel', restricted: 'staff' as const },
    { name: 'warn', desc: 'warn a member', restricted: 'staff' as const },
    { name: 'warnings', desc: 'view warnings', restricted: 'staff' as const },
  ],
  nick: [
    { name: 'clan', desc: 'add clan tag' },
    { name: 'forcenick', desc: 'force nickname', restricted: 'staff' as const },
    { name: 'nickname', desc: 'add random suffix' },
    { name: 'nickstyle', desc: 'style nickname' },
  ],
};

function buildHelpEmbed(guildId: string, category: keyof typeof COMMANDS, page: number): EmbedBuilder {
  const commands = COMMANDS[category];
  const itemsPerPage = 10;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const items = commands.slice(start, end);
  const totalPages = Math.ceil(commands.length / itemsPerPage);

  const description = items
    .map(cmd => {
      const restricted = 'restricted' in cmd ? ` \`${cmd.restricted}\`` : '';
      return `\`/${cmd.name}\` - ${cmd.desc}${restricted}`;
    })
    .join('\n');

  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`📚 ${category} commands`)
    .setDescription(description || '*no commands*')
    .setFooter({ text: `${getBrand(guildId)} • page ${page + 1}/${totalPages}` })
    .setTimestamp();
}

function buildMainEmbed(guildId: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('📚 command help')
    .setDescription(
      `select a category to view commands\n\n` +
      `**admin** - ${COMMANDS.admin.length} commands\n` +
      `**fun** - ${COMMANDS.fun.length} commands\n` +
      `**games** - ${COMMANDS.games.length} commands\n` +
      `**mod** - ${COMMANDS.mod.length} commands\n` +
      `**nick** - ${COMMANDS.nick.length} commands\n\n` +
      `total: ${Object.values(COMMANDS).flat().length} commands`
    )
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

function buildCategoryButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('help_admin').setLabel('admin').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_fun').setLabel('fun').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_games').setLabel('games').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_mod').setLabel('mod').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help_nick').setLabel('nick').setStyle(ButtonStyle.Secondary)
  );
}

function buildNavigationButtons(category: string, page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_${category}_prev_${page}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder().setCustomId('help_main').setLabel('🏠').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`help_${category}_next_${page}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages - 1)
  );
}

export const help: Command = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'view all bot commands',
  cooldown: 3,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder().setName('help').setDescription('view all bot commands'),

  async run(i: ChatInputCommandInteraction) {
    const embed = buildMainEmbed(i.guildId!);
    const row = buildCategoryButtons();
    await i.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  },

  async prefix() {},
};

export async function helpButton(i: ButtonInteraction): Promise<void> {
  const [, category, action, page] = i.customId.split('_');

  if (category === 'main') {
    const embed = buildMainEmbed(i.guildId!);
    const row = buildCategoryButtons();
    return void (await i.update({ embeds: [embed], components: [row] }));
  }

  if (!action) {
    // category button clicked
    const embed = buildHelpEmbed(i.guildId!, category as keyof typeof COMMANDS, 0);
    const commands = COMMANDS[category as keyof typeof COMMANDS];
    const totalPages = Math.ceil(commands.length / 10);
    const row = buildNavigationButtons(category, 0, totalPages);
    return void (await i.update({ embeds: [embed], components: [row] }));
  }

  // navigation button
  const currentPage = parseInt(page);
  const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
  const embed = buildHelpEmbed(i.guildId!, category as keyof typeof COMMANDS, newPage);
  const commands = COMMANDS[category as keyof typeof COMMANDS];
  const totalPages = Math.ceil(commands.length / 10);
  const row = buildNavigationButtons(category, newPage, totalPages);
  await i.update({ embeds: [embed], components: [row] });
}
