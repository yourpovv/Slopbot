import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as leveling from '../../data/leveling';
import { COLORS } from '../../config';

const cmd: Command = {
  name: 'rank',
  aliases: ['level', 'xp'],
  description: 'show rank card',
  cooldown: 5,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('show rank card')
    .addUserOption(o =>
      o.setName('user').setDescription('user to check')
    ),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user') ?? i.user;
    const config = leveling.getLevelingConfig(i.guildId!);
    
    if (!config.enabled) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'leveling is not enabled')],
        flags: MessageFlags.Ephemeral,
      });
    }
    
    const user = leveling.getUserLevel(i.guildId!, target.id);
    const leaderboard = leveling.getLeaderboard(i.guildId!, 1000);
    const rank = leaderboard.findIndex(u => u.userId === target.id) + 1;
    
    const currentLevel = user.level;
    const nextLevel = currentLevel + 1;
    const xpForNext = leveling.xpForLevel(nextLevel);
    const xpForCurrent = leveling.xpForLevel(currentLevel);
    const progress = user.xp - xpForCurrent;
    const needed = xpForNext - xpForCurrent;
    const percent = Math.floor((progress / needed) * 100);
    
    const bar = createProgressBar(percent);
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setDescription(
        `**Level ${currentLevel}** • **${user.xp.toLocaleString()}** XP\n` +
        `${bar} ${percent}%\n` +
        `**${needed - progress}** XP to Level ${nextLevel}\n\n` +
        `**Rank:** #${rank > 0 ? rank : 'Unranked'}\n` +
        `**Messages:** ${user.messagesSent.toLocaleString()}`
      );
    
    await i.reply({ embeds: [embed] });
  },

  async prefix() {
  },
};

function createProgressBar(percent: number): string {
  const filled = Math.floor(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export default cmd;
