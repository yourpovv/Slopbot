import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { repLeaderboardEmbed } from '../../services/embeds';
import * as rep from '../../data/rep';

const TOP_COUNT = 10;

function board(entries: { userId: string; total: number }[]): string {
  if (!entries.length) return 'no rep given yet';
  return entries
    .map((e, i) => `\`${i + 1}.\` <@${e.userId}> - **${e.total}** rep`)
    .join('\n');
}

const cmd: Command = {
  name: 'reptop',
  aliases: ['replb', 'repleaderboard'],
  description: 'rep leaderboard',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('reptop')
    .setDescription('rep leaderboard'),

  async run(i: ChatInputCommandInteraction) {
    const entries = rep.leaderboard(i.guildId!, TOP_COUNT);
    const { embed, file } = repLeaderboardEmbed(i.guildId!, board(entries));
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const entries = rep.leaderboard(msg.guildId!, TOP_COUNT);
    const { embed, file } = repLeaderboardEmbed(msg.guildId!, board(entries));
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export default cmd;
