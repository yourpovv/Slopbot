import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as leveling from '../../data/leveling';
import { COLORS } from '../../config';

const cmd: Command = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'server xp leaderboard',
  cooldown: 10,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('server xp leaderboard')
    .addIntegerOption(o =>
      o.setName('page').setDescription('page number').setMinValue(1)
    ),

  async run(i: ChatInputCommandInteraction) {
    const config = leveling.getLevelingConfig(i.guildId!);
    
    if (!config.enabled) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'leveling is not enabled')],
        flags: MessageFlags.Ephemeral,
      });
    }
    
    const page = i.options.getInteger('page') ?? 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;
    
    const users = leveling.getLeaderboard(i.guildId!, perPage, offset);
    
    if (users.length === 0) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'info', 'no users found on this page')],
        flags: MessageFlags.Ephemeral,
      });
    }
    
    const lines: string[] = [];
    
    for (let idx = 0; idx < users.length; idx++) {
      const u = users[idx];
      const rank = offset + idx + 1;
      const user = await i.client.users.fetch(u.userId).catch(() => null);
      const name = user ? user.tag : `User ${u.userId}`;
      
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`;
      lines.push(`${medal} ${name} • Level **${u.level}** • **${u.xp.toLocaleString()}** XP`);
    }
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setTitle(`📊 Leaderboard • Page ${page}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Showing ${offset + 1}-${offset + users.length}` });
    
    await i.reply({ embeds: [embed] });
  },

  async prefix() {
  },
};

export default cmd;
